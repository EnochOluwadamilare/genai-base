import { describe, it } from 'vitest';
import IconButtonDot from './IconButtonDot';
import { render, screen } from '@testing-library/react';

describe('IconButtonDot', () => {
    it('render', ({ expect }) => {
        render(<IconButtonDot count={22}>Hello</IconButtonDot>);

        expect(screen.getByText('Hello')).toBeVisible();
        expect(screen.getByText('22')).toBeVisible();
    });
});
