import { describe, it, vi } from 'vitest';
import { DataConnection, Peer } from 'peerjs';
import PeerConnection from './PeerConnection';
import EventEmitter from 'eventemitter3';
import { PeerJSMessage } from './types';

describe('PeerConnection', () => {
    it('can open a p2p connection', async ({ expect }) => {
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
        } as unknown as DataConnection;
        const peer = {
            once: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.once(e, fn)),
        } as unknown as Peer;
        const conn = new PeerConnection('test-peer', peer, false, dc);

        expect(dc.on).toHaveBeenCalledWith('open', expect.any(Function));
        expect(dc.on).toHaveBeenCalledWith('close', expect.any(Function));
        expect(dc.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(dc.on).toHaveBeenCalledWith('data', expect.any(Function));

        ee.emit('open');

        expect(dc.peerConnection.getStats).toHaveBeenCalled();

        await vi.waitFor(() => {
            expect(conn.connectionType).toBe('p2p');
        });

        conn.close();
        expect(dc.removeAllListeners).toHaveBeenCalled();
    });

    it('forwards a p2p send', ({ expect }) => {
        const ee = new EventEmitter();
        const dc = {
            on: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.on(e, fn)),
            peerConnection: {
                getStats: vi.fn(async () => []),
            },
            send: vi.fn(),
            close: vi.fn(),
            removeAllListeners: vi.fn(),
        } as unknown as DataConnection;
        const peer = {
            once: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.once(e, fn)),
        } as unknown as Peer;
        const conn = new PeerConnection('test-peer', peer, false, dc);

        ee.emit('open');
        conn.send({ event: 'something' });

        expect(dc.send).toHaveBeenCalledWith({ event: 'something' });
    });

    it('can open a websocket connection', async ({ expect }) => {
        const ee = new EventEmitter();
        const peer = {
            id: 'testpeer',
            open: true,
            socket: {
                send: vi.fn(),
                on: vi.fn(),
                off: vi.fn(),
            },
            on: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.on(e, fn)),
            once: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.once(e, fn)),
        } as unknown as Peer;
        const conn = new PeerConnection('test-peer', peer, false);
        const cryptoEvent = vi.fn();
        conn.on('crypto', cryptoEvent);

        expect(conn.connectionType).toBe('server');
        await vi.waitFor(() => {
            expect(peer.socket.send).toHaveBeenCalledWith({
                type: 'KEY',
                src: 'testpeer',
                dst: 'test-peer',
                payload: expect.any(String),
            });
        });

        expect(cryptoEvent).toHaveBeenCalled();
    });

    it('accepts a remote public key', async ({ expect }) => {
        const ee = new EventEmitter();
        const peer = {
            id: 'testpeer',
            socket: {
                send: vi.fn(),
                on: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.on(e, fn)),
                off: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.off(e, fn)),
            },
            on: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.on(e, fn)),
            once: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.once(e, fn)),
        } as unknown as Peer;

        const conn1 = new PeerConnection('test-peer', peer, false);
        const cryptoEvent1 = vi.fn();
        conn1.on('crypto', cryptoEvent1);
        await vi.waitFor(() => {
            expect(cryptoEvent1).toHaveBeenCalled();
        });

        const conn2 = new PeerConnection('test-peer2', peer, false);
        const cryptoEvent2 = vi.fn();
        conn2.on('crypto', cryptoEvent2);
        await vi.waitFor(() => {
            expect(cryptoEvent2).toHaveBeenCalled();
        });

        const openEvent = vi.fn();
        conn2.on('open', openEvent);

        const key = conn1.getPublicKey();
        if (key) {
            conn2.setKey(key);
            ee.emit('message', { type: 'KEY', dst: 'test-peer2', src: 'test-peer', payload: key });
        }
        await vi.waitFor(() => {
            expect(openEvent).toHaveBeenCalled();
        });
    });

    it('can communicate with encrypted data', async ({ expect }) => {
        const msgs: PeerJSMessage[] = [];
        const ee = new EventEmitter();
        const peer = {
            id: 'testpeer',
            socket: {
                send: (d: PeerJSMessage) => {
                    msgs.push(d);
                },
                on: vi.fn(),
                off: vi.fn(),
            },
            on: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.on(e, fn)),
            once: vi.fn((e: string, fn: (...args: unknown[]) => void) => ee.once(e, fn)),
        } as unknown as Peer;

        const conn1 = new PeerConnection('test-peer', peer, false);
        const cryptoEvent = vi.fn();
        conn1.on('crypto', cryptoEvent);
        const conn2 = new PeerConnection('test-peer', peer, false);
        conn2.on('crypto', cryptoEvent);

        await vi.waitFor(() => {
            expect(cryptoEvent).toHaveBeenCalledTimes(2);
        });

        const openEvent = vi.fn();
        conn1.on('open', openEvent);
        conn2.on('open', openEvent);

        const key1 = conn1.getPublicKey();
        expect(key1).toBeTypeOf('string');
        if (key1) {
            conn2.setKey(key1);
        }
        const key2 = conn2.getPublicKey();
        expect(key2).toBeTypeOf('string');
        if (key2) {
            conn1.setKey(key2);
        }
        await vi.waitFor(() => {
            expect(openEvent).toHaveBeenCalledTimes(2);
        });

        msgs.length = 0;
        conn1.send({ event: 'testevent1' });

        await vi.waitFor(() => {
            expect(msgs).toHaveLength(1);
        });

        const msg = msgs.pop();

        const dataEvent = vi.fn();
        conn2.on('data', dataEvent);

        await conn2.decryptPayload(msg?.payload || '');
        expect(dataEvent).toHaveBeenCalledWith({ event: 'testevent1' }, expect.any(Object));
    });
});
