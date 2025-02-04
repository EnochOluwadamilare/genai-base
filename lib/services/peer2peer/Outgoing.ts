import EventEmitter from 'eventemitter3';
import PeerConnection, { IConnectionIO } from './PeerConnection';
import { BuiltinEvent, PeerEvent, PeerStatus } from './types';
import { PeerError } from 'peerjs';
import { expBackoff } from '@base/util/backoff';

function isPeerEvent(data: unknown): data is BuiltinEvent {
    return typeof (data as PeerEvent).event === 'string';
}

interface OutgoingOptions {
    retryDelay?: number;
}

export default class Outgoing extends EventEmitter<'connect' | 'retry' | 'close' | 'data'> implements IConnectionIO {
    private _connection: PeerConnection;
    private timeout = -1;
    private retryCount = 0;
    private options?: OutgoingOptions;
    public readonly direction: 'outgoing' | 'incoming' = 'outgoing';
    private connectionCount = 0;
    private _status: PeerStatus = 'connecting';

    constructor(connection: PeerConnection, options?: OutgoingOptions) {
        super();
        this._connection = connection;
        this.options = options;
        this.addHandlers();
    }

    public get status() {
        return this._status;
    }

    private delayedRecreate() {
        this._status = 'connecting';
        if (this.timeout >= 0) clearTimeout(this.timeout);
        this.timeout = window.setTimeout(() => {
            this.recreate();
        }, this.options?.retryDelay || expBackoff(this.retryCount++));
    }

    private recreate(server = false) {
        this._status = 'connecting';
        const old = this._connection;
        old.removeAllListeners();
        old.close();

        if (old.peerInstance.destroyed) return;

        this._connection = new PeerConnection(
            old.peer,
            old.peerInstance,
            true,
            server || old.connectionType === 'server'
                ? undefined
                : old.peerInstance.connect(old.peer, { reliable: true })
        );
        this.addHandlers();
    }

    private addHandlers() {
        this._connection.on('timeout', () => {
            this.emit('retry');
            this.recreate(true);
        });

        this._connection.on('open', () => {
            this.retryCount = 0;
            this._connection.send({ event: 'eter:join' });
            this.connectionCount += 1;
            this._status = 'ready';
            this.emit('connect', this._connection);
        });

        this._connection.on('data', async (data: unknown) => {
            if (isPeerEvent(data)) {
                this.emit('data', data as PeerEvent, this._connection);
            }
        });

        this._connection.on('error', (err: PeerError<string>) => {
            console.error(err.type);
        });

        this._connection.on('close', (_, explicit: boolean) => {
            if (!explicit) {
                this.emit('retry');
                this.delayedRecreate();
            } else {
                this.close();
            }
        });
    }

    public get connection() {
        return this._connection;
    }

    /** Close and do not reconnect */
    public close() {
        if (this.timeout >= 0) clearTimeout(this.timeout);
        //if (this._connection.open) {
        this._connection.removeAllListeners();
        this._connection.close();
        this._status = 'failed';
        this.emit('close');
        //}
    }
}
