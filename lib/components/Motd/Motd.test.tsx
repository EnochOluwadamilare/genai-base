import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Motd from './Motd';

describe('Motd Component', () => {
    it('can show an info message', async ({ expect }) => {
        render(<Motd message="info:Test Message 1" />);
        expect(await screen.findByText('Test Message 1')).toBeVisible();
    });

    it('can show an warn message', async ({ expect }) => {
        render(<Motd message="warn:Test Message 2" />);
        expect(await screen.findByText('Test Message 2')).toBeVisible();
    });

    it('can show an error message', async ({ expect }) => {
        render(<Motd message="error:Test Message 3" />);
        expect(await screen.findByText('Test Message 3')).toBeVisible();
    });

    it('can fetch the message', async ({ expect }) => {
        globalThis.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ motd: 'info:Hello World' }),
            } as unknown as Response)
        );

        render(<Motd />);
        vi.waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalled();
        });
        expect(await screen.findByText('Hello World')).toBeVisible();
    });
});
