import EventEmitter from 'eventemitter3';
import Peer, { DataConnection } from 'peerjs';
import { PeerConnectionType, PeerJSMessage, PeerStatus } from './types';
import { createAsym } from '@base/util/crypto';
import { base64ToBytes, bytesToBase64 } from '@base/util/base64';
import P2PException from './error';

const WAIT_TIME = 10000;

export default class PeerConnection extends EventEmitter<'open' | 'data' | 'close' | 'error' | 'crypto' | 'timeout'> {
    private dataConnection?: DataConnection;
    public readonly peerInstance: Peer;
    public readonly peer: string;
    private _connType: PeerConnectionType = 'server';
    private pubKey?: string;
    private createCrypto?: (key: string) => Promise<{
        encrypt: (data: string) => Promise<[ArrayBuffer, Uint8Array]>;
        decrypt: (data: ArrayBuffer, iv: Uint8Array) => Promise<string>;
    }>;
    private encrypt?: (data: string) => Promise<[ArrayBuffer, Uint8Array]>;
    private decrypt?: (data: ArrayBuffer, iv: Uint8Array) => Promise<string>;
    private queue?: string[];
    private connectTimeout = -1;
    public readonly initiated: boolean;
    private wsListener?: (d: PeerJSMessage) => void;

    public get connectionType() {
        return this._connType;
    }

    public get open() {
        return this.dataConnection ? this.dataConnection.open : !!this.encrypt;
    }

    public get connectionId() {
        return this.peer;
    }

    /** Quality of the connection from 0 to 3. */
    public get quality(): number {
        if (!this.open) return 0;
        switch (this.connectionType) {
            case 'p2p':
                return 3;
            case 'relay':
                return 2;
            case 'server':
                return 1;
        }
    }

    /** Create a connection. If the dataConnection parameter is missing then it uses the websocket as a relay. */
    constructor(
        peer: string,
        peerInstance: Peer,
        initiated: boolean,
        dataConnection?: DataConnection,
        dropICE?: boolean
    ) {
        super();
        this.initiated = initiated;
        this.peerInstance = peerInstance;
        this.dataConnection = dataConnection;
        this.peer = peer;

        if (dataConnection) {
            this._connType = 'relay';

            dataConnection.on('open', () => {
                clearTimeout(this.connectTimeout);
                this.connectTimeout = -1;

                dataConnection.peerConnection.getStats().then((stats) => {
                    stats.forEach((v) => {
                        if (v.type === 'candidate-pair' && (v.state === 'succeeded' || v.state === 'in-progress')) {
                            const remote = stats.get(v.remoteCandidateId);
                            if (remote?.candidateType === 'relay') {
                                this._connType = 'relay';
                            } else if (remote) {
                                this._connType = 'p2p';
                            }
                        }
                    });
                    if (this._connType === 'server') {
                        console.warn('Failed to find p2p candidate', Array.from(stats));
                    }
                    this.emit('open', this);
                });
            });
            dataConnection.on('close', () => {
                this.emit('close', this, false);
            });
            dataConnection.on('data', (data) => {
                this.emit('data', data, this);
            });
            dataConnection.on('error', (err) => {
                this.emit('error', err, this);
            });
            dataConnection.on('iceStateChanged', (state: RTCIceConnectionState) => {
                if (state === 'disconnected') {
                    if (dataConnection.open) {
                        dataConnection.close();
                    } /*else {
                            this.emit('close', this, false);
                            this.alive = false;
                        }*/
                }
                if (dropICE && state === 'checking') {
                    dataConnection.close();
                    this.emit('close', this, false);
                }
            });
        } else {
            this._connType = 'server';
            createAsym()
                .then(({ createSymCrypto, publicKey }) => {
                    this.createCrypto = createSymCrypto;
                    this.pubKey = publicKey;

                    this.sendCryptoHandshake();
                    this.emit('crypto');
                })
                .catch(() => {
                    this.emit('error', { type: 'no-crypto' }, this);
                    this.close();
                });
            const wslisten = (d: PeerJSMessage) => {
                if (d.src === this.peer && d.payload) {
                    if (d.type === 'KEY') {
                        this.setKey(d.payload);
                    } else if (d.type === 'DATA') {
                        this.decryptPayload(d.payload);
                    }
                }
            };
            this.wsListener = wslisten;
            this.peerInstance.socket.on('message', wslisten);
            this.peerInstance.once('disconnected', () => {
                //if (this.alive) {
                if (this.wsListener) {
                    this.peerInstance.socket.off('message', this.wsListener);
                    this.wsListener = undefined;
                }
                this.emit('close', this, false);
                //}
            });
        }

        if (this.initiated) {
            this.connectTimeout = window.setTimeout(() => {
                this.connectTimeout = -1;
                if (!this.open) {
                    console.warn('Connect timeout', this);
                    this.close(); // Just double check
                    this.emit('timeout', this);
                } else {
                    console.warn('Timeout, but already open');
                }
            }, WAIT_TIME);
        }
    }

    public getPublicKey() {
        return this.pubKey;
    }

    /** Set the remote public key */
    public async setKey(key: string) {
        if (this.dataConnection) {
            throw new P2PException('Public key is not needed on P2P connection');
        }

        if (this.createCrypto) {
            if (this.encrypt) console.warn('Key already received');
            const { encrypt, decrypt } = await this.createCrypto(key);
            this.encrypt = encrypt;
            this.decrypt = decrypt;
            clearTimeout(this.connectTimeout);
            this.connectTimeout = -1;
            this.emit('open', this);

            if (this.queue) {
                this.queue.forEach((d) => {
                    this.decryptPayload(d);
                });
                this.queue = undefined;
            }
        } else {
            this.once('crypto', () => {
                this.setKey(key);
            });
        }
    }

    /** Send our public key to the remote */
    public sendCryptoHandshake() {
        if (this.peerInstance.open) {
            this.peerInstance.socket.send({
                type: 'KEY',
                src: this.peerInstance.id,
                dst: this.peer,
                payload: this.pubKey,
            });
        }
    }

    /** For websocket data, decrypt it and emit the event */
    public async decryptPayload(data: string) {
        if (this.decrypt) {
            const d = JSON.parse(data) as { data: string; iv: string };

            if (!d || !d.data || !d.iv) throw new P2PException('Invalid encrypted packet');

            const dBuf = await base64ToBytes(d.data);
            const dIv = await base64ToBytes(d.iv);

            try {
                const decrypted = await this.decrypt(new Uint8Array(dBuf), new Uint8Array(dIv));
                this.emit('data', JSON.parse(decrypted), this);
            } catch (e) {
                console.error('Decryption error');
            }
        } else {
            const q = this.queue || [];
            q.push(data);
            this.queue = q;
        }
    }

    private async sendEncrypted(data: unknown) {
        if (this.encrypt) {
            const d = await this.encrypt(JSON.stringify(data));
            const dText = await bytesToBase64(d[0]);
            const dIv = await bytesToBase64(d[1]);
            const payload = JSON.stringify({
                data: dText,
                iv: dIv,
            });

            this.peerInstance.socket.send({
                type: 'DATA',
                src: this.peerInstance.id,
                dst: this.peer,
                payload,
            });
        } else {
            throw new P2PException('Failed to send, no key');
        }
    }

    public send(data: unknown) {
        if (this.dataConnection) {
            this.dataConnection.send(data);
        } else {
            this.sendEncrypted(data);
        }
    }

    public close() {
        if (this.connectTimeout >= 0) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = -1;
        }
        if (this.dataConnection) {
            this.dataConnection.removeAllListeners();
            const wasOpen = this.dataConnection.open;
            this.dataConnection.close();
            if (wasOpen) this.emit('close', this, true);
        } else if (this.open) {
            this.encrypt = undefined;
            this.decrypt = undefined;
            this.emit('close', this, true);
        }
        if (this.wsListener) {
            this.peerInstance.socket.off('message', this.wsListener);
            this.wsListener = undefined;
        }
    }
}

export interface IConnectionIO extends EventEmitter<'connect' | 'retry' | 'close' | 'data'> {
    direction: 'outgoing' | 'incoming';
    connection: PeerConnection;
    close: () => void;
    status: PeerStatus;
}
