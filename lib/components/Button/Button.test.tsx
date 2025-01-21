import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
    it('renders', ({ expect }) => {
        render(<Button data-testid="but">TestButton</Button>);
        expect(screen.getByTestId('but')).toBeVisible();
    });
});
