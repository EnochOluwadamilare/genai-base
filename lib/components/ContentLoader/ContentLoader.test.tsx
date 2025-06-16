import { describe, it, vi } from 'vitest';
import ContentLoader from './ContentLoader';
import { render, waitFor } from '@testing-library/react';
import { createZipArrayBuffer } from '@base/util/zip';

describe('ContentLoader Component', () => {
    it('can load a zip blob', async ({ expect }) => {
        const loadFn = vi.fn();
        const data = await createZipArrayBuffer({
            testData: {
                name: 'Test2',
            },
        });

        render(
            <ContentLoader
                content={[data]}
                onLoad={loadFn}
            />
        );

        await waitFor(() => {
            expect(loadFn).toHaveBeenCalledWith({
                testData: {
                    name: 'Test2',
                },
            });
        });
    });
});
