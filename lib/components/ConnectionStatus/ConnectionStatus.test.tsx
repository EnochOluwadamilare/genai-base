import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConnectionStatus from './ConnectionStatus';
import { Peer2Peer, PeerEvent, TestWrapper } from '@base/main';

const { mockGetRTConfig, mockCheck } = vi.hoisted(() => {
    return {
        mockGetRTConfig: vi.fn(async () => ({ expiresOn: new Date(), iceServers: [] })),
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
    it('shows connecting status', ({ expect }) => {
        const mockPeer = {
            on: vi.fn(),
            off: vi.fn(),
            destroy: vi.fn(),
            status: 'connecting',
        } as unknown as Peer2Peer<PeerEvent>;
        render(
            <TestWrapper>
                <ConnectionStatus
                    api="API"
                    appName="TEST"
                    ready={false}
                    peer={mockPeer}
                />
            </TestWrapper>
        );

        expect(mockGetRTConfig).toHaveBeenCalled();
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
            <TestWrapper>
                <ConnectionStatus
                    api="API"
                    appName="TEST"
                    ready={true}
                    peer={mockPeer}
                />
            </TestWrapper>
        );

        await vi.waitFor(() => expect(mockCheck).toHaveBeenCalled());
        expect(screen.getByText('loader.messages.quality3')).toBeVisible();
    });
});
