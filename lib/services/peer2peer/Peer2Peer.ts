import { CommunicationRelayConfiguration } from '@base/components/ConnectionStatus/ice';
import { Peer as P2P, PeerError } from 'peerjs';
import EE from 'eventemitter3';
import { BuiltinEvent, Connection, PeerErrorType, PeerEvent, PeerJSMessage, PeerStatus } from './types';
import PeerConnection from './PeerConnection';

const MAX_BACKOFF = 4;
const BASE_RETRY_TIME = 1000;
const WAIT_TIME = 10000;
const HEARTBEAT_TIMEOUT = 10000;
const MAX_ID_RETRY = 10;
const MAX_CONN_RETRY = 20;

function expBackoff(count: number) {
    return Math.pow(2, Math.min(count, MAX_BACKOFF)) * BASE_RETRY_TIME;
}

function isPeerEvent(data: unknown): data is BuiltinEvent {
    return typeof (data as PeerEvent).event === 'string';
}

type P2PDataEvent<T extends PeerEvent> = {
    data: [data: T, conn: Connection<T>];
};

type P2PStatusEvent = {
    status: [status: PeerStatus];
};

type P2PQualityEvent = {
    quality: [quality: number];
};

type P2PErrorEvent = {
    error: [error: PeerErrorType];
};

type P2PConnectEvent<T extends PeerEvent> = {
    connect: [conn: Connection<T>];
};

type P2PCloseEvent<T extends PeerEvent> = {
    close: [conn: Connection<T>];
};

type P2POpenEvent = {
    open: [];
};

type P2PEvents<T extends PeerEvent> = P2PDataEvent<T> &
    P2PErrorEvent &
    P2PStatusEvent &
    P2PConnectEvent<T> &
    P2PCloseEvent<T> &
    P2POpenEvent &
    P2PQualityEvent;

export interface P2POptions {
    forceWebsocket?: boolean;
    forceTURN?: boolean;
    dropICE?: boolean;
}

export default class Peer2Peer<T extends PeerEvent> {
    private emitter = new EE();
    private peer: P2P;
    private connections = new Map<string, PeerConnection>();
    private heatbeatTimeout = -1;
    private connectTimeout = -1;
    private retryTimeout = -1;
    public status: PeerStatus = 'starting';
    private connRetryCount = 0;
    public isRelay = false;
    public error: PeerErrorType = 'none';
    private peerRetryCount = 0;
    private idRetryCount = 0;
    private server?: string;
    private host: string;
    private secure: boolean;
    private port: number;
    private key: string;
    private ice: CommunicationRelayConfiguration;
    private relay: boolean;
    public readonly code: string;
    private _quality = 0;
    private options?: P2POptions;

    constructor(
        code: string,
        host: string,
        secure: boolean,
        key: string,
        port: number,
        ice: CommunicationRelayConfiguration,
        relay: boolean,
        server?: string,
        options?: P2POptions
    ) {
        this.server = server;
        this.code = code;
        this.host = host;
        (this.secure = secure), (this.key = key || 'peerjs');
        this.port = port || 443;
        this.ice = ice;
        this.relay = relay;
        this.options = options;

        this.peer = this.createPeerServer();
    }

    public get quality(): number {
        return this._quality;
    }

    private updateQuality() {
        if (!this.peer.open || this.peer.disconnected || this.peer.destroyed) {
            this._quality = 0;
        } else {
            let bestQuality = this._quality;
            this.connections.forEach((c) => {
                if (c.open) {
                    bestQuality = Math.max(bestQuality, c.quality);
                }
            });
            this._quality = bestQuality;
        }
        this.emit('quality', this._quality);
    }

    private emit<TEventName extends keyof P2PEvents<T> & string>(
        eventName: TEventName,
        ...eventArg: P2PEvents<T>[TEventName]
    ) {
        this.emitter.emit(eventName, ...eventArg);
    }

    public on<TEventName extends keyof P2PEvents<T> & string>(
        eventName: TEventName,
        handler: (...eventArg: P2PEvents<T>[TEventName]) => void
    ) {
        this.emitter.on(eventName, handler);
    }

    public off<TEventName extends keyof P2PEvents<T> & string>(
        eventName: TEventName,
        handler: (...eventArg: P2PEvents<T>[TEventName]) => void
    ) {
        this.emitter.off(eventName, handler);
    }

    private createPeerServer() {
        const p = new P2P(this.code, {
            host: this.host,
            secure: this.secure,
            key: this.key,
            port: this.port,
            debug: 0,
            config: {
                iceServers: [this.ice.iceServers[0]],
                sdpSemantics: 'unified-plan',
                iceTransportPolicy: this.relay || this.options?.forceTURN ? 'relay' : undefined,
            },
        });
        p.on('open', () => this.onOpen());
        p.on('connection', (conn) => this.onConnection(new PeerConnection(conn.peer, this.peer, conn)));
        p.on('error', (err) => this.onError(err));
        p.on('close', () => {
            this.updateQuality();
        });
        p.on('disconnected', () => {
            this.updateQuality();
        });
        return p;
    }

    /** Completely restart the connection from scratch. */
    public reset() {
        this.destroy();
        this.peer = this.createPeerServer();
    }

    public destroy() {
        this.connections.forEach((c) => {
            c.removeAllListeners();
            c.close();
        });
        this.connections.clear();
        if (this.heatbeatTimeout >= 0) {
            clearTimeout(this.heatbeatTimeout);
        }
        if (this.retryTimeout >= 0) {
            clearTimeout(this.retryTimeout);
        }
        if (this.connectTimeout >= 0) {
            clearTimeout(this.connectTimeout);
        }
        this.peer.removeAllListeners();
        this.peer.destroy();
        this.updateQuality();
    }

    private setStatus(status: PeerStatus) {
        this.status = status;
        this.emit('status', status);
    }

    private setError(error: PeerErrorType) {
        this.updateQuality();
        this.error = error;
        if (error !== 'none') {
            this.emit('error', error);
        }
    }

    private retryConnection(peer: string, useServer?: boolean) {
        const oldConn = this.connections.get(peer);
        this.connections.delete(peer);
        if (oldConn) {
            oldConn.close();
        }
        this.setStatus('retry');
        setTimeout(() => {
            if (this.peer.destroyed) return;
            this.createPeer(peer, useServer);
        }, expBackoff(this.connRetryCount++));
    }

    /** Initiate a connection to a peer */
    public createPeer(code: string, useServer?: boolean) {
        const creationSession = {
            alive: true,
        };
        const conn = new PeerConnection(
            code,
            this.peer,
            useServer ? undefined : this.peer.connect(code, { reliable: true })
        );

        const oldConn = this.connections.get(code);
        if (oldConn) {
            console.warn('Connection already existed when creating peer:', code);
            oldConn.close();
        }

        this.connections.set(conn.peer, conn);

        this.connectTimeout = window.setTimeout(() => {
            this.connectTimeout = -1;
            if (!creationSession.alive) return;
            creationSession.alive = false;
            if (!conn.open) {
                console.warn('Connect timeout', conn);
                conn.close(); // Just double check
                this.connections.delete(conn.peer);
                this.updateQuality();

                if (this.peer.destroyed) return;
                this.setStatus('retry');
                this.createPeer(code, true);
            }
        }, WAIT_TIME);

        conn.on('open', () => {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = -1;

            this.updateQuality();

            conn.send({ event: 'eter:join' });
            this.setStatus('ready');
            this.setError('none');
            this.emit('connect', conn);
        });
        conn.on('data', async (data: unknown) => {
            if (isPeerEvent(data)) {
                if (data.event === 'eter:connect') {
                    this.createPeer(data.code);
                } else {
                    this.emit('data', data as T, conn);
                }
            }
        });
        conn.on('error', (err: PeerError<string>) => {
            console.error(err.type);
            if (!creationSession.alive) return;
            this.setError('unknown');
            this.setStatus('failed');
        });
        conn.on('close', () => {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = -1;
            this.connections.delete(conn.peer);

            this.updateQuality();

            this.emit('close', conn);

            if (creationSession.alive) {
                this.retryConnection(conn.peer, useServer);
            }
            creationSession.alive = false;
        });
    }

    private retry() {
        this.heatbeatTimeout = window.setTimeout(() => {
            if (!document.hidden) {
                this.heatbeatTimeout = -1;
                this.setStatus('retry');
                this.reset();
            } else {
                // Hidden page so try again later.
                this.retry();
            }
        }, HEARTBEAT_TIMEOUT);
    }

    private onOpen() {
        this.peerRetryCount = 0;
        this.idRetryCount = 0;
        this.peer.socket.addListener('message', (d: PeerJSMessage) => {
            if (d.type === 'HEARTBEAT') {
                if (this.heatbeatTimeout >= 0) clearTimeout(this.heatbeatTimeout);
                this.retry();
            } else if (d.type === 'KEY') {
                const conn = this.connections.get(d.src);
                if (!conn || conn.connectionType !== 'server') {
                    const conn = new PeerConnection(d.src, this.peer);
                    this.onConnection(conn);
                    if (d.payload) {
                        const p = d.payload;
                        conn.setKey(p);
                    }
                } else {
                    if (d.payload) {
                        conn.setKey(d.payload);
                    }
                }
            } else if (d.type === 'DATA' && d) {
                const conn = this.connections.get(d.src);
                if (conn && d.payload) {
                    conn.decryptPayload(d.payload);
                }
            }
        });

        // In case no heartbeat is ever received
        this.retry();

        this.updateQuality();

        this.emit('open');

        if (this.server) {
            if (!this.connections.has(this.server)) {
                this.createPeer(this.server, this.options?.forceWebsocket ? true : false);
            }
        } else {
            this.setStatus('ready');
            this.setError('none');
        }
    }

    public getConnection(id: string) {
        return this.connections.get(id);
    }

    private onConnection(conn: PeerConnection) {
        if (this.connections.has(conn.peer)) {
            const oldConn = this.connections.get(conn.peer);
            if (oldConn) {
                console.warn('Connection already existed', conn.peer);
                oldConn.close();
            }
        }
        this.connections.set(conn.peer, conn);

        conn.on('data', async (data: unknown) => {
            if (isPeerEvent(data)) {
                if (data.event === 'eter:connect') {
                    // console.log('GOT PEERS', data.peers);
                    this.createPeer(data.code);
                } else if (data.event === 'ping') {
                    conn.send({ event: 'ping', ok: true });
                } else {
                    this.emit('data', data as T, conn);
                }
            }
        });
        conn.on('error', (err: Error) => {
            console.error(err);
            // if (cbRef.current.onError) cbRef.current.onError(err);
        });

        conn.on('open', () => {
            this.connRetryCount = 0;
            this.updateQuality();
            conn.send({ event: 'eter:welcome' });
        });

        conn.on('close', () => {
            this.connections.delete(conn.peer);
            this.updateQuality();
            //if (cbRef.current.onClose) cbRef.current.onClose(conn);
        });
    }

    private onError(err: PeerError<string>) {
        const type: string = err.type;
        console.error('Peer', type, err);
        switch (type) {
            case 'disconnected':
            case 'network':
                this.setStatus('retry');
                clearTimeout(this.retryTimeout);
                this.retryTimeout = window.setTimeout(() => {
                    try {
                        this.peer.reconnect();
                    } catch (e) {
                        this.setStatus('failed');
                        this.setError('peer-not-found');
                    }
                }, expBackoff(this.peerRetryCount++));
                break;
            case 'server-error':
                this.setStatus('retry');
                clearTimeout(this.retryTimeout);
                this.retryTimeout = window.setTimeout(() => {
                    try {
                        this.peer.reconnect();
                    } catch (e) {
                        this.setStatus('failed');
                        this.setError('peer-not-found');
                    }
                }, expBackoff(this.peerRetryCount++));
                break;
            case 'unavailable-id':
                if (this.idRetryCount < MAX_ID_RETRY) {
                    this.setStatus('retry');
                    clearTimeout(this.retryTimeout);
                    this.retryTimeout = window.setTimeout(() => {
                        this.reset();
                    }, expBackoff(this.idRetryCount++));
                } else {
                    this.peer.destroy();
                    this.setStatus('failed');
                    this.setError('id-in-use');
                }
                break;
            case 'browser-incompatible':
                this.setStatus('failed');
                this.setError('bad-browser');
                break;
            case 'peer-unavailable':
                if (this.server) {
                    if (this.connRetryCount < MAX_CONN_RETRY) {
                        this.retryConnection(this.server);
                    } else {
                        this.setStatus('failed');
                        this.setError('peer-not-found');
                    }
                }
                // If this machine is the server, silent ignore
                break;
            case 'webrtc':
                break;
            default:
                this.setStatus('retry');
                clearTimeout(this.retryTimeout);
                this.retryTimeout = window.setTimeout(() => {
                    this.reset();
                }, expBackoff(this.peerRetryCount++));
        }
        this.updateQuality();
    }

    public sendAll(data: T, exclude?: string[]) {
        if (this.status === 'ready') {
            const excludeSet = exclude ? new Set(exclude) : undefined;
            for (const conn of this.connections.values()) {
                if (excludeSet?.has(conn.connectionId)) continue;
                if (conn.open) conn.send(data);
            }
        }
    }
}
