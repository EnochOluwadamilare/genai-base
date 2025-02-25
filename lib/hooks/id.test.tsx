import { describe, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useID } from './id';

describe('useID', () => {
    it('returns the correct size id', ({ expect }) => {
        const onId = vi.fn();
        function Component({ onId }: { onId: (id: string) => void }) {
            const id = useID(10);
            onId(id);
            return null;
        }

        render(<Component onId={onId} />);

        expect(onId).toHaveBeenCalledWith(expect.stringMatching(/^\d{10}$/));
    });
});
