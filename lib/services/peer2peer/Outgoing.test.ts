import { describe, it, vi } from 'vitest';
import { DataConnection, Peer } from 'peerjs';
import PeerConnection from './PeerConnection';
import EventEmitter from 'eventemitter3';
import Outgoing from './Outgoing';

function createMocks() {
    const ee = new EventEmitter();
    const dc = {
        on: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.on(e, fn)),
        peerConnection: {
            getStats: vi.fn(
                async () => new Map([['a', { type: 'candidate-pair', state: 'succeeded', remoteCandidateId: 'a' }]])
            ),
        },
        close: vi.fn(),
        removeAllListeners: vi.fn(),
        send: vi.fn(),
    } as unknown as DataConnection;
    const peer = {
        once: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.once(e, fn)),
        connect: vi.fn(() => dc),
    } as unknown as Peer;
    return { ee, dc, peer };
}

describe('Outgoing', () => {
    it('can open an outgoing connection', async ({ expect }) => {
        const { dc, peer, ee } = createMocks();
        const conn = new PeerConnection('test-peer', peer, false, dc);
        const out = new Outgoing(conn);

        const connectEvent = vi.fn();
        out.on('connect', connectEvent);

        ee.emit('open');

        await vi.waitFor(() => {
            expect(connectEvent).toHaveBeenCalled();
        });

        expect(dc.send).toHaveBeenCalledWith({ event: 'eter:join' });

        conn.close();
    });

    it('will reconnect after disconnect', async ({ expect }) => {
        const { dc, peer, ee } = createMocks();
        const conn = new PeerConnection('test-peer', peer, false, dc);
        const out = new Outgoing(conn, { retryDelay: 100 });

        const connectEvent = vi.fn();
        out.on('connect', connectEvent);

        ee.emit('open');

        await vi.waitFor(() => {
            expect(connectEvent).toHaveBeenCalledTimes(1);
        });

        connectEvent.mockClear();
        const retryEvent = vi.fn();
        out.on('retry', retryEvent);
        ee.emit('close', dc, false);

        expect(retryEvent).toHaveBeenCalled();

        await vi.waitFor(() => {
            expect(peer.connect).toHaveBeenCalledTimes(1);
        });

        ee.emit('open');

        await vi.waitFor(() => {
            expect(connectEvent).toHaveBeenCalledTimes(1);
        });

        conn.close();
    });
});
