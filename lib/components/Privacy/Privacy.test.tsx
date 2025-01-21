import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Privacy from './Privacy';

describe('Privacy', () => {
    it('renders', ({ expect }) => {
        render(
            <Privacy
                tag="v111"
                appName=""
            />
        );
        expect(screen.getByText('about.privacyTitle')).toBeVisible();
    });
});
