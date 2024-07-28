import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QRCode from './QRCode';
import qr from 'qrcode';
import userEvent from '@testing-library/user-event';

vi.mock('qrcode', () => ({
    default: { toCanvas: vi.fn(async () => {}) },
}));

describe('QRCode component', () => {
    it('renders a qrcode', async ({ expect }) => {
        render(<QRCode url="http://testurl.fi" />);

        expect(screen.getByTestId('qr-code-canvas')).toBeVisible();
        expect(qr.toCanvas).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), 'http://testurl.fi', { width: 164 });
    });

    it('opens a dialog when clicked', async ({ expect }) => {
        const user = userEvent.setup();
        render(
            <QRCode
                url="http://testurl.fi"
                dialog
            />
        );

        await user.click(screen.getByTestId('qr-code-canvas'));
        expect(screen.getByTestId('qr-dialog-link')).toBeVisible();
    });
});
