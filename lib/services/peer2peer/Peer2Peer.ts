import { CommunicationRelayConfiguration } from '@base/components/ConnectionStatus/ice';
import { Peer as P2P, PeerError } from 'peerjs';
import EE from 'eventemitter3';
import { BuiltinEvent, Connection, PeerErrorType, PeerEvent, PeerJSMessage, PeerStatus } from './types';
import PeerConnection, { IConnectionIO } from './PeerConnection';
import Outgoing from './Outgoing';
import Incoming from './Incoming';

const MAX_BACKOFF = 3;
const BASE_RETRY_TIME = 1000;
const HEARTBEAT_TIMEOUT = 10000;
const MAX_ID_RETRY = 20;
const MAX_CONN_RETRY = 30;

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

type P2PRetryEvent = {
    retry: [];
};

type P2PEvents<T extends PeerEvent> = P2PDataEvent<T> &
    P2PErrorEvent &
    P2PStatusEvent &
    P2PConnectEvent<T> &
    P2PCloseEvent<T> &
    P2POpenEvent &
    P2PRetryEvent &
    P2PQualityEvent;

export interface P2POptions {
    forceWebsocket?: boolean;
    forceTURN?: boolean;
    dropICE?: boolean;
}

export default class Peer2Peer<T extends PeerEvent> {
    private emitter = new EE();
    private peer: P2P;
    private connections = new Map<string, IConnectionIO>();
    private heatbeatTimeout = -1;
    private retryTimeout = -1;
    public status: PeerStatus = 'connecting';
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
    public boundSendAll: (typeof this)['sendAll'];
    private failed = false;

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

        this.boundSendAll = this.sendAll.bind(this);
    }

    public get quality(): number {
        return this._quality;
    }

    public get size(): number {
        return this.connections.size;
    }

    private update() {
        if (!this.peer.open || this.peer.disconnected || this.peer.destroyed) {
            this._quality = 0;
            this.status = this.failed ? 'failed' : 'connecting';
        } else if (this.server) {
            const conn = this.connections.get(this.server);
            this._quality = conn?.connection.quality || 0;
            this.status = conn?.status || 'connecting';
        } else {
            let bestQuality = this._quality;
            this.connections.forEach((c) => {
                if (c.connection.open) {
                    bestQuality = Math.max(bestQuality, c.connection.quality);
                }
            });
            this._quality = Math.max(bestQuality, 1);
            this.status = 'ready';
        }
        this.emit('quality', this._quality);
        this.emit('status', this.status);
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
        p.on('connection', (conn) => this.onConnection(new PeerConnection(conn.peer, this.peer, false, conn)));
        p.on('error', (err) => this.onError(err));
        p.on('close', () => {
            this.update();
        });
        p.on('disconnected', () => {
            if (this.heatbeatTimeout >= 0) clearTimeout(this.heatbeatTimeout);
            this.update();
        });
        return p;
    }

    /** Completely restart the connection from scratch. */
    public reset() {
        this.destroy();
        this.emit('retry');
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
        this.peer.removeAllListeners();
        this.peer.destroy();
        this.update();
    }

    private setError(error: PeerErrorType) {
        this.update();
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

        setTimeout(() => {
            if (this.peer.destroyed) return;
            this.createPeer(peer, useServer);
        }, expBackoff(this.connRetryCount++));
    }

    /** Initiate a connection to a peer */
    public createPeer(code: string, useServer?: boolean) {
        const conn = new PeerConnection(
            code,
            this.peer,
            true,
            useServer ? undefined : this.peer.connect(code, { reliable: true })
        );

        const oldConn = this.connections.get(code);
        if (oldConn) {
            console.warn('Connection already existed when creating peer:', code);
            oldConn.close();
        }

        const out = new Outgoing(conn);

        this.connections.set(conn.peer, out);

        out.on('retry', () => {
            this.update();
        });

        out.on('connect', () => {
            this.update();
            this.setError('none');
            this.emit('connect', out.connection);
        });
        out.on('data', async (data: unknown) => {
            if (isPeerEvent(data)) {
                if (data.event === 'eter:connect') {
                    this.createPeer(data.code);
                } else {
                    this.emit('data', data as T, out.connection);
                }
            }
        });

        out.on('close', () => {
            this.connections.delete(out.connection.peer);
            this.update();
            this.emit('close', out.connection);
        });
    }

    private retry() {
        if (this.heatbeatTimeout >= 0) clearTimeout(this.heatbeatTimeout);
        this.heatbeatTimeout = window.setTimeout(() => {
            if (!document.hidden) {
                this.heatbeatTimeout = -1;
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
                if (!conn || conn.connection.connectionType !== 'server') {
                    const conn = new PeerConnection(d.src, this.peer, false);
                    this.onConnection(conn);
                    if (d.payload) {
                        const p = d.payload;
                        conn.setKey(p);
                    }
                }
            }
        });

        // In case no heartbeat is ever received
        this.retry();

        this.update();

        this.emit('open');

        if (this.server) {
            if (!this.connections.has(this.server)) {
                this.createPeer(this.server, this.options?.forceWebsocket ? true : false);
            } else {
                this.setError('none');
            }
        } else {
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
                oldConn.close();
                console.warn('Connection already existed', oldConn);
            }
        }
        const incom = new Incoming(conn);
        this.connections.set(conn.peer, incom);

        incom.on('data', async (data: unknown) => {
            if (isPeerEvent(data)) {
                if (data.event === 'eter:connect') {
                    // console.log('GOT PEERS', data.peers);
                    this.createPeer(data.code);
                } else if (data.event === 'ping') {
                    incom.connection.send({ event: 'ping', ok: true });
                } else {
                    this.emit('data', data as T, incom.connection);
                }
            }
        });

        incom.on('connect', () => {
            this.connRetryCount = 0;
            this.update();
            this.emit('connect', incom.connection);
        });

        incom.on('close', () => {
            this.connections.delete(incom.connection.peer);
            this.update();
            this.emit('close', incom.connection);
        });
    }

    private onError(err: PeerError<string>) {
        const type: string = err.type;
        console.warn('Peer-error:', type);
        switch (type) {
            case 'disconnected':
            case 'network':
            case 'server-error':
                clearTimeout(this.retryTimeout);
                this.retryTimeout = window.setTimeout(() => {
                    try {
                        this.peer.reconnect();
                    } catch (e) {
                        this.setError('peer-not-found');
                    }
                }, expBackoff(this.peerRetryCount++));
                break;
            case 'unavailable-id':
                if (this.idRetryCount < MAX_ID_RETRY) {
                    clearTimeout(this.retryTimeout);
                    this.retryTimeout = window.setTimeout(() => {
                        this.reset();
                    }, expBackoff(this.idRetryCount++));
                } else {
                    this.peer.destroy();
                    this.setError('id-in-use');
                }
                break;
            case 'browser-incompatible':
                this.setError('bad-browser');
                break;
            case 'peer-unavailable':
                if (this.server) {
                    if (this.connRetryCount < MAX_CONN_RETRY) {
                        this.retryConnection(this.server);
                    } else {
                        this.setError('peer-not-found');
                    }
                }
                // If this machine is the server, silent ignore
                break;
            case 'webrtc':
                break;
            default:
                clearTimeout(this.retryTimeout);
                this.retryTimeout = window.setTimeout(() => {
                    this.reset();
                }, expBackoff(this.peerRetryCount++));
        }
        this.update();
    }

    public sendAll(data: T, exclude?: string[]) {
        if (this.status === 'ready') {
            const excludeSet = exclude ? new Set(exclude) : undefined;
            for (const conn of this.connections.values()) {
                if (excludeSet?.has(conn.connection.connectionId)) continue;
                if (conn.connection.open) conn.connection.send(data);
            }
        }
    }
}
