import EventEmitter from 'eventemitter3';
import Peer, { DataConnection } from 'peerjs';
import { PeerConnectionType } from './types';
import { createAsym } from '@base/util/crypto';
import { base64ToBytes, bytesToBase64 } from '@base/util/base64';
import P2PException from './error';

export default class PeerConnection extends EventEmitter<'open' | 'data' | 'close' | 'error' | 'crypto'> {
    private dataConnection?: DataConnection;
    private peerInstance: Peer;
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

    public get connectionType() {
        return this._connType;
    }

    public get open() {
        return this.dataConnection ? this.dataConnection.open : !!this.encrypt;
    }

    public get connectionId() {
        return this.dataConnection ? this.dataConnection.connectionId : this.peer;
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
    constructor(peer: string, peerInstance: Peer, dataConnection?: DataConnection, dropICE?: boolean) {
        super();
        this.peerInstance = peerInstance;
        this.dataConnection = dataConnection;
        this.peer = peer;

        if (dataConnection) {
            dataConnection.on('open', () => {
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
                this.emit('close', this);
            });
            dataConnection.on('data', (data) => {
                this.emit('data', data, this);
            });
            dataConnection.on('error', (err) => {
                this.emit('error', err, this);
            });
            dataConnection.on('iceStateChanged', (state: RTCIceConnectionState) => {
                if (state === 'disconnected') {
                    if (dataConnection.open) dataConnection.close();
                    else this.emit('close', this);
                }
                if (dropICE && state === 'checking') dataConnection.close();
            });
        } else {
            this._connType = 'server';
            createAsym().then(({ createSymCrypto, publicKey }) => {
                this.createCrypto = createSymCrypto;
                this.pubKey = publicKey;

                this.sendCryptoHandshake();
                this.emit('crypto');
            });
            this.peerInstance.on('disconnected', () => {
                this.emit('close', this);
            });
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
            const { encrypt, decrypt } = await this.createCrypto(key);
            this.encrypt = encrypt;
            this.decrypt = decrypt;
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
        this.peerInstance.socket.send({
            type: 'KEY',
            src: this.peerInstance.id,
            dst: this.peer,
            payload: this.pubKey,
        });
    }

    /** For websocket data, decrypt it and emit the event */
    public async decryptPayload(data: string) {
        if (this.decrypt) {
            const d = JSON.parse(data) as { data: string; iv: string };

            if (!d || !d.data || !d.iv) throw new P2PException('Invalid encrypted packet');

            const dBuf = await base64ToBytes(d.data);
            const dIv = await base64ToBytes(d.iv);
            const decrypted = await this.decrypt(new Uint8Array(dBuf), new Uint8Array(dIv));
            this.emit('data', JSON.parse(decrypted), this);
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
        if (this.dataConnection?.open) {
            this.dataConnection.close();
        } else if (this.open) {
            this.encrypt = undefined;
            this.decrypt = undefined;
            this.emit('close', this);
        }
    }
}
