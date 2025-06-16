import { describe, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import usePeer, { Peer, usePeerStatus } from './peer';
import { iceConfig, webrtcActive } from '@base/state/webrtcState';
import { createStore, Provider } from 'jotai';
import EE from 'eventemitter3';

const { MockPeer2Peer } = vi.hoisted(() => {
    return {
        MockPeer2Peer: vi.fn(function MockPeer2Peer(this: { status: string }) {
            this.status = 'connecting';
        }),
    };
});

vi.mock('@base/services/peer2peer/Peer2Peer', () => {
    const Peer2Peer = MockPeer2Peer;
    Peer2Peer.prototype.on = vi.fn();
    Peer2Peer.prototype.off = vi.fn();
    Peer2Peer.prototype.destroy = vi.fn();
    return { default: Peer2Peer };
});

describe('Peer Component', () => {
    it('can connect', ({ expect }) => {
        const store = createStore();
        store.set(iceConfig, {
            expiresOn: new Date(),
            iceServers: [],
        });
        store.set(webrtcActive, 'full');

        render(
            <Provider store={store}>
                <Peer
                    peerkey="xxx"
                    code="yyy"
                />
            </Provider>
        );

        expect(MockPeer2Peer).toHaveBeenCalledWith(
            'yyy',
            'api2.gen-ai.fi',
            true,
            'xxx',
            443,
            { expiresOn: expect.any(Date), iceServers: [] },
            false,
            undefined,
            {
                forceTURN: undefined,
                forceWebsocket: undefined,
            }
        );
    });

    it('responds to status changes', async ({ expect }) => {
        const ee = new EE();

        MockPeer2Peer.prototype.on.mockImplementation((event: string, callback: () => void) => {
            ee.on(event, callback);
            return ee;
        });

        const store = createStore();
        store.set(iceConfig, {
            expiresOn: new Date(),
            iceServers: [],
        });
        store.set(webrtcActive, 'full');

        function Status() {
            const status = usePeerStatus();
            console.log('Status:', status);
            return <div data-testid="status">{status}</div>;
        }

        render(
            <Provider store={store}>
                <Peer
                    peerkey="xxx"
                    code="yyy"
                >
                    <Status />
                </Peer>
            </Provider>
        );

        expect(screen.getByTestId('status')).toHaveTextContent('connecting');

        ee.emit('status', 'connected');
        await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));
    });
});

describe('usePeer', () => {
    it('initiates a peer connection', ({ expect }) => {
        function Component() {
            usePeer({ code: '1234', server: '1235', host: 'localhost' });
            return null;
        }

        const store = createStore();
        store.set(iceConfig, {
            expiresOn: new Date(),
            iceServers: [],
        });
        store.set(webrtcActive, 'full');

        render(
            <Provider store={store}>
                <Component />
            </Provider>
        );

        expect(MockPeer2Peer).toHaveBeenCalledWith(
            '1234',
            'localhost',
            false,
            'peerjs',
            443,
            { expiresOn: expect.any(Date), iceServers: [] },
            false,
            '1235',
            {
                forceTURN: undefined,
                forceWebsocket: undefined,
            }
        );

        expect(MockPeer2Peer.prototype.on).toHaveBeenCalledWith('status', expect.any(Function));
        expect(MockPeer2Peer.prototype.on).toHaveBeenCalledWith('data', expect.any(Function));
    });
});
