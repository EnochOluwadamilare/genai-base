import { useRef, useEffect, useState, createContext, useContext, PropsWithChildren } from 'react';
import { iceConfig, webrtcActive } from '../state/webrtcState';
import { useAtom, useAtomValue } from 'jotai';
import Peer2Peer, { type P2POptions } from '@base/services/peer2peer/Peer2Peer';
import type { Connection, PeerEvent, PeerStatus } from '@base/services/peer2peer/types';

const PeerContext = createContext<Peer2Peer<PeerEvent> | null>(null);

export const PeerProvider = PeerContext.Provider;

interface PeerProps extends PropsWithChildren {
    code: string;
    server?: string;
    forceTURN?: boolean;
    forceWebsocket?: boolean;
    host?: string;
    secure?: boolean;
    peerkey: string;
    port?: number;
    disabled?: boolean;
}

export function Peer<T extends PeerEvent>({
    children,
    code,
    server,
    host,
    secure,
    peerkey,
    port,
    forceTURN,
    forceWebsocket,
    disabled,
}: PeerProps) {
    const [peer, setPeer] = useState<Peer2Peer<T> | null>(null);
    const [webrtc, setWebRTC] = useAtom(webrtcActive);
    const ice = useAtomValue(iceConfig);

    useEffect(() => {
        if (disabled) {
            //setStatus('failed');
            setWebRTC('disabled');
            return;
        } else {
            //setStatus('connecting');
        }
        if (webrtc === 'unset') return;
        if (webrtc === 'disabled') {
            setWebRTC('unset');
            return;
        }
        if (!code) return;
        if (!ice) {
            /*setTimeout(() => {
                setStatus('failed');
            }, 5000);
            setStatus('failed');*/
            return;
        }

        const npeer = new Peer2Peer<T>(
            code,
            host || 'api2.gen-ai.fi',
            secure ?? true,
            peerkey,
            port || 443,
            ice,
            webrtc === 'relay',
            server,
            { forceTURN, forceWebsocket }
        );

        setPeer(npeer);

        return () => {
            npeer.destroy();
        };
    }, [code, host, secure, peerkey, port, server, webrtc, ice, forceTURN, forceWebsocket, disabled, setWebRTC]);

    return <PeerProvider value={peer}>{children}</PeerProvider>;
}

export function usePeerObject<T extends PeerEvent>() {
    const peer = useContext<Peer2Peer<T> | null>(PeerContext);
    return peer;
}

const voidfn = () => {};

export function usePeerSender<T extends PeerEvent>() {
    const peer = useContext(PeerContext);
    if (!peer) {
        return voidfn;
    }
    return peer.boundSendAll as (data: T, exclude?: string[]) => void;
}

export function usePeerStatus() {
    const peer = useContext(PeerContext);
    const [status, setStatus] = useState<PeerStatus>(peer?.status || 'connecting');

    useEffect(() => {
        if (peer) {
            const h = (s: PeerStatus) => setStatus(s);
            setStatus(peer.status);
            peer.on('status', h);
            return () => {
                peer.off('status', h);
            };
        }
    }, [peer]);

    return status;
}

export function usePeerOpen(fn: () => void) {
    const peer = useContext(PeerContext);
    const ref = useRef(fn);
    ref.current = fn;

    useEffect(() => {
        if (peer) {
            const h = () => ref.current();
            peer.on('open', h);
            return () => {
                peer.off('open', h);
            };
        }
    }, [peer]);
}

export function usePeerClose<T extends PeerEvent>(fn: (conn?: Connection<T>) => void) {
    const peer = useContext<Peer2Peer<T> | null>(PeerContext);
    const ref = useRef(fn);
    ref.current = fn;

    useEffect(() => {
        if (peer) {
            const h = (conn?: Connection<T>) => ref.current(conn);
            peer.on('close', h);
            return () => {
                peer.off('close', h);
            };
        }
    }, [peer]);
}

export function usePeerData<T extends PeerEvent>(fn: (data: T, conn: Connection<T>) => void) {
    const peer = useContext<Peer2Peer<T> | null>(PeerContext);
    const ref = useRef(fn);
    ref.current = fn;

    useEffect(() => {
        if (peer) {
            const h = (data: T, conn: Connection<T>) => ref.current(data, conn);
            peer.on('data', h);
            return () => {
                peer.off('data', h);
            };
        }
    }, [peer]);
}

export function usePeerEvent<T extends PeerEvent>(event: T['event'], fn: (data: T, conn: Connection<T>) => void) {
    const peer = useContext<Peer2Peer<T> | null>(PeerContext);
    const ref = useRef(fn);
    ref.current = fn;

    useEffect(() => {
        if (peer) {
            const h = (data: T, conn: Connection<T>) => {
                if (data.event === event) {
                    ref.current(data, conn);
                }
            };
            peer.on('data', h);
            return () => {
                peer.off('data', h);
            };
        }
    }, [peer, event]);
}

export function usePeerConnect<T extends PeerEvent>(fn: (conn: Connection<T>) => void) {
    const peer = useContext<Peer2Peer<T> | null>(PeerContext);
    const ref = useRef(fn);
    ref.current = fn;

    useEffect(() => {
        if (peer) {
            const h = (conn: Connection<T>) => ref.current(conn);
            peer.on('connect', h);
            return () => {
                peer.off('connect', h);
            };
        }
    }, [peer]);
}

export function usePeerError(fn: (err: string) => void) {
    const peer = useContext<Peer2Peer<PeerEvent> | null>(PeerContext);
    const ref = useRef(fn);
    ref.current = fn;

    useEffect(() => {
        if (peer) {
            const h = (err: string) => ref.current(err);
            peer.on('error', h);
            return () => {
                peer.off('error', h);
            };
        }
    }, [peer]);
}

interface Callbacks<T extends PeerEvent> {
    onOpen?: () => void;
    onConnect?: (conn: Connection<T>) => void;
    onClose?: (conn?: Connection<T>) => void;
    onError?: (e: unknown) => void;
    onData?: (data: T, conn: Connection<T>) => void;
}

interface Props<T extends PeerEvent> extends Callbacks<T>, P2POptions {
    code?: string;
    server?: string;
    host: string;
    secure?: boolean;
    key?: string;
    port?: number;
    disabled?: boolean;
}

//export type PeerProps<T extends PeerEvent> = Props<T>;

/** @deprecated */
export default function usePeer<T extends PeerEvent>({
    code,
    server,
    host,
    secure,
    port,
    key,
    disabled,
    onOpen,
    onClose,
    onError,
    onData,
    onConnect,
    forceTURN,
    forceWebsocket,
}: Props<T>) {
    const [peer, setPeer] = useState<Peer2Peer<T>>();
    const cbRef = useRef<Callbacks<T>>({});
    const [webrtc, setWebRTC] = useAtom(webrtcActive);
    const ice = useAtomValue(iceConfig);
    const [status, setStatus] = useState<PeerStatus>('connecting');

    useEffect(() => {
        cbRef.current.onClose = onClose;
        cbRef.current.onOpen = onOpen;
        cbRef.current.onConnect = onConnect;
        cbRef.current.onError = onError;
        cbRef.current.onData = onData;
    }, [onData, onOpen, onClose, onError, onConnect]);

    useEffect(() => {
        if (disabled) {
            setStatus('failed');
            setWebRTC('disabled');
            return;
        } else {
            setStatus('connecting');
        }
        if (webrtc === 'unset') return;
        if (webrtc === 'disabled') {
            setWebRTC('unset');
            return;
        }
        if (!code) return;
        if (!ice) {
            setTimeout(() => {
                setStatus('failed');
            }, 5000);
            setStatus('failed');
            return;
        }

        // setStatus('connecting');

        const npeer = new Peer2Peer<T>(
            code,
            host,
            secure || false,
            key || 'peerjs',
            port || 443,
            ice,
            webrtc === 'relay',
            server,
            { forceTURN, forceWebsocket }
        );

        npeer.on('status', setStatus);
        npeer.on('data', (data: T, conn: Connection<T>) => {
            if (cbRef.current.onData) cbRef.current.onData(data as T, conn);
        });
        npeer.on('close', (conn: Connection<T>) => {
            if (cbRef.current.onClose) cbRef.current.onClose(conn);
        });
        npeer.on('connect', (conn: Connection<T>) => {
            if (cbRef.current.onConnect) cbRef.current.onConnect(conn);
        });

        setPeer(npeer);

        return () => {
            npeer.destroy();
        };
    }, [code, server, webrtc, ice, host, key, port, secure, disabled, setWebRTC, forceTURN, forceWebsocket]);

    //useEffect(() => {
    /*const tabClose = () => {
            if (connRef.current?.sender) connRef.current?.sender({ event: 'eter:close' });
        };
        window.addEventListener('beforeunload', tabClose);
        return () => {
            window.removeEventListener('beforeunload', tabClose);
        };*/
    //}, []);

    return {
        send: peer ? peer.boundSendAll : undefined,
        ready: status === 'ready',
        peer,
    };
}
