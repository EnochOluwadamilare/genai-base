import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PercentageBar from './PercentageBar';

describe('PercentageBar', () => {
    it('renders', ({ expect }) => {
        render(
            <PercentageBar
                colour="blue"
                value={50}
            />
        );
        expect(screen.getByText('50%')).toBeVisible();
    });
});
