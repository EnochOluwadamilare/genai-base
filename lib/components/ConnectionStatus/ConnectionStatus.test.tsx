import { beforeEach, describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConnectionStatus from './ConnectionStatus';
import { Peer2Peer, PeerEvent } from '@base/main';
import { webrtcActive } from '@base/state/webrtcState';
import { CommunicationRelayConfiguration } from './ice';
import { createStore, Provider } from 'jotai';
import { PeerProvider } from '@base/hooks/peer';

const { mockGetRTConfig, mockCheck } = vi.hoisted(() => {
    return {
        mockGetRTConfig: vi.fn((_a: unknown, _b: unknown, resolve: (ice: CommunicationRelayConfiguration) => void) =>
            resolve({ expiresOn: new Date(), iceServers: [] })
        ),
        mockCheck: vi.fn(async () => true),
    };
});

vi.mock('./ice', () => ({
    getRTConfig: mockGetRTConfig,
}));

vi.mock('./check', () => ({
    checkP2P: mockCheck,
}));

describe('ConnectionStatus', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('shows connecting status', ({ expect }) => {
        const mockPeer = {
            on: vi.fn(),
            off: vi.fn(),
            destroy: vi.fn(),
            status: 'connecting',
        } as unknown as Peer2Peer<PeerEvent>;
        render(
            <Provider>
                <PeerProvider value={mockPeer}>
                    <ConnectionStatus
                        api="API"
                        appName="TEST"
                    />
                </PeerProvider>
            </Provider>
        );

        expect(mockGetRTConfig).toHaveBeenCalled();
        expect(screen.getByText('loader.messages.connecting')).toBeVisible();
    });

    it('works without a peer object', ({ expect }) => {
        render(
            <Provider>
                <ConnectionStatus
                    api="API"
                    appName="TEST"
                />
            </Provider>
        );

        expect(mockGetRTConfig).toHaveBeenCalled();
        expect(screen.getByText('loader.messages.connecting')).toBeVisible();
    });

    it('attempts to get media permissions', async ({ expect }) => {
        const mockPeer = {
            on: vi.fn(),
            off: vi.fn(),
            destroy: vi.fn(),
            status: 'connecting',
        } as unknown as Peer2Peer<PeerEvent>;

        const mockGetUserMedia = vi.fn(async () => {
            return {} as MediaStream;
        });

        Object.defineProperty(global.navigator, 'mediaDevices', {
            value: {
                getUserMedia: mockGetUserMedia,
            },
        });

        const store = createStore();
        store.set(webrtcActive, 'unset');

        render(
            <Provider store={store}>
                <PeerProvider value={mockPeer}>
                    <ConnectionStatus
                        api="API"
                        appName="TEST"
                        noCheck
                    />
                </PeerProvider>
            </Provider>
        );

        expect(mockGetRTConfig).toHaveBeenCalled();
        await vi.waitFor(() => expect(mockGetUserMedia).toHaveBeenCalled());
        expect(screen.getByText('loader.messages.connecting')).toBeVisible();
    });

    it('can show good quality connection', async ({ expect }) => {
        const mockPeer = {
            on: vi.fn(),
            off: vi.fn(),
            destroy: vi.fn(),
            status: 'ready',
            quality: 3,
            code: '1234',
        } as unknown as Peer2Peer<PeerEvent>;
        render(
            <Provider>
                <PeerProvider value={mockPeer}>
                    <ConnectionStatus
                        api="API"
                        appName="TEST"
                    />
                </PeerProvider>
            </Provider>
        );

        await vi.waitFor(() => expect(mockCheck).toHaveBeenCalled());
        expect(screen.getByText('loader.messages.quality3')).toBeVisible();
    });
});
