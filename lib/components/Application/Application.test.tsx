import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Application from './Application';
import { createMemoryRouter, createRoutesFromElements, Route } from 'react-router';

describe('Application', () => {
    it('renders', ({ expect }) => {
        const routes = createRoutesFromElements(
            <Route path="/">
                <Route
                    path="test"
                    element={<div>HelloWorld</div>}
                />
            </Route>
        );
        const memRouter = createMemoryRouter(routes, { initialEntries: ['/test'] });
        render(<Application router={memRouter} />);

        expect(screen.getByText('HelloWorld')).toBeVisible();
    });
});
