import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import IconMenu from './IconMenu';
import IconMenuItem from './Item';
import Spacer from './Spacer';

describe('IconMenu', () => {
    it('renders', ({ expect }) => {
        render(
            <IconMenu>
                <IconMenuItem tooltip="tooltip1">Content</IconMenuItem>
                <Spacer />
                <IconMenuItem tooltip="tooltip2">World</IconMenuItem>
            </IconMenu>
        );

        expect(screen.getByText('Content')).toBeVisible();
    });
});
