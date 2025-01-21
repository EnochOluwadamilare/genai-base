import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BusyButton from './BusyButton';

describe('BusyButton', () => {
    it('renders', ({ expect }) => {
        render(<BusyButton data-testid="busybut">TestButton</BusyButton>);
        expect(screen.getByTestId('busybut')).toBeVisible();
    });
});
