import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlertPara from './AlertPara';

describe('AlertPara', () => {
    it('renders', ({ expect }) => {
        render(<AlertPara severity="info">Something</AlertPara>);
        expect(screen.getByText('Something')).toBeVisible();
    });
});
