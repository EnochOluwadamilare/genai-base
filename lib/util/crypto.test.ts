import { describe, it } from 'vitest';
import { createAsym } from './crypto';

describe('Crypto', () => {
    it('initiate a sym encryption via public key', async ({ expect }) => {
        const asym1 = await createAsym();
        expect(asym1.publicKey).toBeTypeOf('string');

        const asym2 = await createAsym();

        const sym1 = await asym1.createSymCrypto(asym2.publicKey);
        const sym2 = await asym2.createSymCrypto(asym1.publicKey);

        const [e1, iv] = await sym2.encrypt('hello world 1');
        const d1 = await sym1.decrypt(e1, iv);
        expect(d1).toBe('hello world 1');
    });
});
