import { ConnectionStatus, useID } from '@base/main';
import { Story, StoryDefault } from '@ladle/react';
import { Theme, Recoil } from './decorators';
import './style.css';
import { useEffect, useRef } from 'react';
import { PeerEvent } from '@base/services/peer2peer/types';
import { Peer, usePeerData, usePeerEvent, usePeerSender } from '@base/hooks/peer';

export default {
    decorators: [Theme, Recoil],
} satisfies StoryDefault;

export const Start: Story = () => {
    const id = useID(5);
    return (
        <Peer
            host={import.meta.env.VITE_APP_PEER_SERVER}
            secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
            peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
            port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
            code={`test-${id}`}
        >
            <ConnectionStatus
                api={import.meta.env.VITE_APP_APIURL}
                appName="dev"
            />
        </Peer>
    );
};

export const LoopP2P: Story = () => {
    const id = useID(5);
    const counter = useRef(0);

    function Looper() {
        const send = usePeerSender();
        usePeerEvent('ping', (data: PeerEvent) => {
            console.log('Data', data, counter.current++);
        });

        useEffect(() => {
            if (send) {
                const int = setInterval(() => {
                    send({ event: 'ping' });
                }, 1000);
                return () => {
                    clearInterval(int);
                };
            }
        }, [send]);

        return null;
    }

    return (
        <>
            <Peer
                host={import.meta.env.VITE_APP_PEER_SERVER}
                secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
                peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
                port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
                code={`test-server`}
            >
                <Looper />
                <ConnectionStatus
                    api={import.meta.env.VITE_APP_APIURL}
                    appName="dev"
                    noCheck
                />
            </Peer>
            <Peer
                host={import.meta.env.VITE_APP_PEER_SERVER}
                secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
                peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
                port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
                code={`test-${id}`}
                server={'test-server'}
            >
                <Looper />
                <ConnectionStatus
                    api={import.meta.env.VITE_APP_APIURL}
                    appName="dev"
                    noCheck
                />
            </Peer>
        </>
    );
};

export const LoopRelay: Story = () => {
    const id = useID(5);
    const counter = useRef(0);

    function Looper() {
        const send = usePeerSender();
        usePeerData((data: PeerEvent) => {
            console.log('Data', data, counter.current++);
        });

        useEffect(() => {
            if (send) {
                const int = setInterval(() => {
                    send({ event: 'ping' });
                }, 1000);
                return () => {
                    clearInterval(int);
                };
            }
        }, [send]);

        return null;
    }

    return (
        <>
            <Peer
                host={import.meta.env.VITE_APP_PEER_SERVER}
                secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
                peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
                port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
                code={`test-server`}
                forceTURN
            >
                <Looper />
                <ConnectionStatus
                    api={import.meta.env.VITE_APP_APIURL}
                    appName="dev"
                    noCheck
                />
            </Peer>
            <Peer
                host={import.meta.env.VITE_APP_PEER_SERVER}
                secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
                peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
                port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
                code={`test-${id}`}
                server={'test-server'}
                forceTURN
            >
                <Looper />
                <ConnectionStatus
                    api={import.meta.env.VITE_APP_APIURL}
                    appName="dev"
                    noCheck
                />
            </Peer>
        </>
    );
};

export const LoopSocket: Story = () => {
    const id = useID(5);
    const counter = useRef(0);

    function Looper() {
        const send = usePeerSender();
        usePeerData((data: PeerEvent) => {
            console.log('Data', data, counter.current++);
        });

        useEffect(() => {
            if (send) {
                const int = setInterval(() => {
                    send({ event: 'ping' });
                }, 1000);
                return () => {
                    clearInterval(int);
                };
            }
        }, [send]);

        return null;
    }

    return (
        <>
            <Peer
                host={import.meta.env.VITE_APP_PEER_SERVER}
                secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
                peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
                port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
                code={`test-server`}
                forceWebsocket
            >
                <Looper />
                <ConnectionStatus
                    api={import.meta.env.VITE_APP_APIURL}
                    appName="dev"
                    noCheck
                />
            </Peer>
            <Peer
                host={import.meta.env.VITE_APP_PEER_SERVER}
                secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
                peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
                port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
                code={`test-${id}`}
                server={'test-server'}
                forceWebsocket
            >
                <Looper />
                <ConnectionStatus
                    api={import.meta.env.VITE_APP_APIURL}
                    appName="dev"
                    noCheck
                />
            </Peer>
        </>
    );
};

interface DisabledProps {
    disabled: boolean;
}

export const Disabled: Story<DisabledProps> = ({ disabled }: DisabledProps) => {
    const id = useID(5);

    return (
        <Peer
            host={import.meta.env.VITE_APP_PEER_SERVER}
            secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
            peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
            port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
            code={`test-${id}`}
            disabled={disabled}
        >
            <ConnectionStatus
                api={import.meta.env.VITE_APP_APIURL}
                appName="dev"
            />
        </Peer>
    );
};

Disabled.args = {
    disabled: true,
};
