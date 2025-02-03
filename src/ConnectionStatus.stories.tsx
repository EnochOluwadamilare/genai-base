import { ConnectionStatus, useID, usePeer } from '@base/main';
import { Story, StoryDefault } from '@ladle/react';
import { Theme, Recoil } from './decorators';
import './style.css';
import { useCallback, useEffect, useRef } from 'react';
import { PeerEvent } from '@base/services/peer2peer/types';

export default {
    decorators: [Theme, Recoil],
} satisfies StoryDefault;

export const Start: Story = () => {
    const id = useID(5);
    const { ready, peer } = usePeer({
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-${id}`,
    });
    return (
        <ConnectionStatus
            api={import.meta.env.VITE_APP_APIURL}
            appName="dev"
            ready={ready}
            peer={peer}
        />
    );
};

export const LoopP2P: Story = () => {
    const id = useID(5);
    const counter = useRef(0);
    const onData = useCallback((d: PeerEvent) => {
        console.log('Data', d, counter.current++);
    }, []);
    const {
        ready,
        peer,
        send: send1,
    } = usePeer({
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-server`,
        onData,
    });

    const { send: send2 } = usePeer({
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-${id}`,
        server: `test-server`,
        onData,
    });

    useEffect(() => {
        if (ready && send2 && send1) {
            const int = setInterval(() => {
                send1({ event: 'ping1' });
                send2({ event: 'ping2' });
            }, 1000);
            return () => {
                clearInterval(int);
            };
        }
    }, [ready, send1, send2]);

    return (
        <ConnectionStatus
            api={import.meta.env.VITE_APP_APIURL}
            appName="dev"
            ready={ready}
            peer={peer}
            noCheck
        />
    );
};

export const LoopRelay: Story = () => {
    const id = useID(5);
    const counter = useRef(0);
    const onData = useCallback((d: PeerEvent) => {
        console.log('Data', d, counter.current++);
    }, []);
    const {
        ready,
        peer,
        send: send1,
    } = usePeer({
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-server`,
        forceTURN: true,
        onData,
    });

    const { send: send2 } = usePeer({
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-${id}`,
        server: `test-server`,
        forceTURN: true,
        onData,
    });

    useEffect(() => {
        if (ready && send2 && send1) {
            const int = setInterval(() => {
                send1({ event: 'ping1' });
                send2({ event: 'ping2' });
            }, 1000);
            return () => {
                clearInterval(int);
            };
        }
    }, [ready, send1, send2]);

    return (
        <ConnectionStatus
            api={import.meta.env.VITE_APP_APIURL}
            appName="dev"
            ready={ready}
            peer={peer}
            noCheck
        />
    );
};

export const LoopSocket: Story = () => {
    const id = useID(5);
    const onData = useCallback((d: PeerEvent) => {
        console.log('Data', d);
    }, []);
    const {
        ready,
        peer,
        send: send1,
    } = usePeer({
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-server`,
        forceWebsocket: true,
        onData,
    });

    const { send: send2 } = usePeer({
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-${id}`,
        server: `test-server`,
        forceWebsocket: true,
        onData,
    });

    useEffect(() => {
        if (ready && send2 && send1) {
            const int = setInterval(() => {
                send1({ event: 'ping1' });
                send2({ event: 'ping2' });
            }, 1000);
            return () => {
                clearInterval(int);
            };
        }
    }, [ready, send1, send2]);

    return (
        <ConnectionStatus
            api={import.meta.env.VITE_APP_APIURL}
            appName="dev"
            ready={ready}
            peer={peer}
            noCheck
        />
    );
};

interface DisabledProps {
    disabled: boolean;
}

export const Disabled: Story<DisabledProps> = ({ disabled }: DisabledProps) => {
    const id = useID(5);
    const { ready, peer } = usePeer({
        disabled,
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-${id}`,
    });
    return (
        <ConnectionStatus
            api={import.meta.env.VITE_APP_APIURL}
            appName="dev"
            ready={ready}
            peer={peer}
            noCheck
        />
    );
};

Disabled.args = {
    disabled: true,
};
