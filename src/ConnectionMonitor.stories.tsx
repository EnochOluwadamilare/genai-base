import { ConnectionMonitor, useID, usePeer } from '@base/main';
import { Story, StoryDefault } from '@ladle/react';
import { Theme, Recoil } from './decorators';
import './style.css';

export default {
    decorators: [Theme, Recoil],
} satisfies StoryDefault;

export const Start: Story = () => {
    const id = useID(5);
    const { ready, status, error } = usePeer({
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-${id}`,
    });
    return (
        <ConnectionMonitor
            api={import.meta.env.VITE_APP_APIURL}
            appName="test"
            ready={ready}
            status={status}
            error={error}
            keepOpen
        />
    );
};

interface DisabledProps {
    disabled: boolean;
}

export const Disabled: Story<DisabledProps> = ({ disabled }: DisabledProps) => {
    const id = useID(5);
    const { ready, status, error } = usePeer({
        disabled,
        host: import.meta.env.VITE_APP_PEER_SERVER,
        secure: import.meta.env.VITE_APP_PEER_SECURE === '1',
        key: import.meta.env.VITE_APP_PEER_KEY || 'peerjs',
        port: import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443,
        code: `test-${id}`,
    });
    return (
        <ConnectionMonitor
            api={import.meta.env.VITE_APP_APIURL}
            appName="test"
            ready={ready}
            status={status}
            error={error}
            keepOpen
        />
    );
};

Disabled.args = {
    disabled: true,
};
