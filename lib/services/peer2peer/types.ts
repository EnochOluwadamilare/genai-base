export type PeerStatus = 'starting' | 'failed' | 'ready' | 'retry' | 'inactive';
export type PeerErrorType =
    | 'none'
    | 'id-in-use'
    | 'peer-not-found'
    | 'no-signaling'
    | 'missing-ice'
    | 'unknown'
    | 'bad-browser';

export type PeerConnectionType = 'p2p' | 'relay' | 'server';

export interface PeerEvent {
    event: string;
}

interface PeerCloseEvent extends PeerEvent {
    event: 'eter:close';
}

interface PeerPingEvent extends PeerEvent {
    event: 'ping';
}

interface PeerJoinEvent extends PeerEvent {
    event: 'eter:join';
}

interface PeerWelcomeEvent extends PeerEvent {
    event: 'eter:welcome';
}

interface PeerChainEvent extends PeerEvent {
    event: 'eter:connect';
    code: string;
}

export interface PeerJSMessage {
    type: string;
    dst: string;
    src: string;
    payload?: string;
}

export type BuiltinEvent = PeerWelcomeEvent | PeerCloseEvent | PeerJoinEvent | PeerChainEvent | PeerPingEvent;

export type SenderType<T> = (data: T | BuiltinEvent, exclude?: string[]) => void;

export interface Connection<T extends PeerEvent> {
    send: (data: T) => void;
}

// 'connect' | 'data' | 'close' | 'open' | 'error' | 'status'
