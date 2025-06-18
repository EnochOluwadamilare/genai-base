import { render, screen, waitFor } from '@testing-library/react';
import { describe, it } from 'vitest';
import WorkflowLayout from './Layout';
import { Widget } from './Widget';

describe('WorkflowLayout', () => {
    it('renders a single connecting line', async ({ expect }) => {
        render(
            <WorkflowLayout connections={[{ start: 'w1', end: 'w2', startPoint: 'right', endPoint: 'left' }]}>
                <Widget dataWidget="w1">Hello</Widget>
                <Widget dataWidget="w2">World</Widget>
            </WorkflowLayout>
        );

        await waitFor(() => expect(screen.getByTestId('line-widget-w1-widget-w2')).toBeVisible());
    });
});
