import EventEmitter from 'eventemitter3';
import { beforeEach, describe, it, vi } from 'vitest';
import { DataConnection } from 'peerjs';

const ee = new EventEmitter();
const mockPeer = {
    on: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.on(e, fn)),
    socket: {
        addListener: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.on(e, fn)),
    },
};

vi.doMock('peerjs', () => ({
    Peer: function () {
        this.on = mockPeer.on;
        this.socket = mockPeer.socket;
        this.open = true;
    },
}));

describe('Peer2Peer Class', () => {
    beforeEach(() => {
        ee.removeAllListeners();
    });

    it('can connect to a peer server', async ({ expect }) => {
        const { default: Peer2Peer } = await import('./Peer2Peer');
        new Peer2Peer('test-1', '', false, '', 80, { iceServers: [], expiresOn: new Date() }, false);
        expect(mockPeer.on).toHaveBeenCalledWith('open', expect.any(Function));
        expect(mockPeer.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('can handle an open event from peer server', async ({ expect }) => {
        const { default: Peer2Peer } = await import('./Peer2Peer');
        const p2p = new Peer2Peer('test-1', '', false, '', 80, { iceServers: [], expiresOn: new Date() }, false);

        const openEvent = vi.fn();
        p2p.on('open', openEvent);

        ee.emit('open');
        expect(openEvent).toHaveBeenCalled();
        expect(mockPeer.socket.addListener).toHaveBeenCalledWith('message', expect.any(Function));
        expect(p2p.status).toBe('ready');
        expect(p2p.quality).toBe(0);
    });

    it('will listen for a new p2p connection', async ({ expect }) => {
        const { default: Peer2Peer } = await import('./Peer2Peer');
        const p2p = new Peer2Peer('test-1', '', false, '', 80, { iceServers: [], expiresOn: new Date() }, false);

        ee.emit('open');

        const eec = new EventEmitter();
        const dc = {
            on: vi.fn((e: string, fn: (...args: unknown[]) => void) => eec.on(e, fn)),
            peerConnection: {
                getStats: vi.fn(async () => []),
            },
            send: vi.fn(),
            peer: 'test-p1',
        } as unknown as DataConnection;

        ee.emit('connection', dc);

        expect(dc.on).toHaveBeenCalledWith('open', expect.any(Function));
        eec.emit('open');

        const conn = p2p.getConnection('test-p1');
        expect(conn).toBeTruthy();
        const openEvent = vi.fn();
        conn?.on('open', openEvent);
        await vi.waitFor(() => {
            expect(openEvent).toHaveBeenCalled();
        });
        expect(dc.send).toHaveBeenCalledWith({ event: 'eter:welcome' });
    });
});
