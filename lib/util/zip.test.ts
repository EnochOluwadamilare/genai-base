import { describe, it } from 'vitest';
import { createZipBlob, loadZipFile } from './zip';

describe('Zip Utilities', () => {
    it('can save a zip file', async ({ expect }) => {
        const zip = await createZipBlob({
            testData: {
                name: 'Test1',
            },
        });

        expect(zip).toBeInstanceOf(Blob);
        expect(zip.type).toBe('application/zip');
    });

    it('can load a saved zip file', async ({ expect }) => {
        const zip = await createZipBlob({
            testData: {
                name: 'Test1',
            },
        });

        const data = await loadZipFile(zip);
        expect(data).toEqual({ testData: { name: 'Test1' } });
    });
});
