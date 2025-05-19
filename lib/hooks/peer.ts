import { useRef, useEffect, useState } from 'react';
import { iceConfig, webrtcActive } from '../state/webrtcState';
import { useAtom, useAtomValue } from 'jotai';
import Peer2Peer, { type P2POptions } from '@base/services/peer2peer/Peer2Peer';
import type { Connection, PeerEvent, PeerStatus } from '@base/services/peer2peer/types';

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

export type PeerProps<T extends PeerEvent> = Props<T>;

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
