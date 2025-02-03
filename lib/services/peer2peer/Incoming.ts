import EventEmitter from 'eventemitter3';
import PeerConnection, { IConnectionIO } from './PeerConnection';
import { BuiltinEvent, PeerEvent } from './types';
import { PeerError } from 'peerjs';

function isPeerEvent(data: unknown): data is BuiltinEvent {
    return typeof (data as PeerEvent).event === 'string';
}

export default class Incoming extends EventEmitter<'connect' | 'close' | 'data'> implements IConnectionIO {
    private _connection: PeerConnection;
    public readonly direction: 'outgoing' | 'incoming' = 'incoming';

    constructor(connection: PeerConnection) {
        super();
        this._connection = connection;
        this.addHandlers();
    }

    private addHandlers() {
        this._connection.on('open', () => {
            this._connection.send({ event: 'eter:welcome' });
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

        this._connection.on('close', () => {
            this._connection.removeAllListeners();
            this._connection.close();
            this.emit('close');
        });
    }

    public get connection() {
        return this._connection;
    }

    public close() {
        this._connection.removeAllListeners();
        this._connection.close();
        this.emit('close');
    }
}
