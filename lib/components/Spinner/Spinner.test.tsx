import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from './Spinner';

describe('Spinner', () => {
    it('renders', ({ expect }) => {
        render(<Spinner />);
        expect(screen.getByTestId('spinner')).toBeVisible();
    });
});
