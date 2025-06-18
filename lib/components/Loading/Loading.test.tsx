import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from './Loading';

describe('Loading', () => {
    it('renders when loading', ({ expect }) => {
        render(<Loading loading={true} />);
        expect(screen.getByTestId('spinner')).toBeVisible();
    });

    it('renders children when not loading', ({ expect }) => {
        render(
            <Loading loading={false}>
                <div data-testid="test1">Hello</div>
            </Loading>
        );
        expect(screen.getByTestId('test1')).toBeVisible();
    });
});
