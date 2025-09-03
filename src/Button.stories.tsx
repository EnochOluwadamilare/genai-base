import { BusyButton, Button, LargeButton, VerticalButton } from '@base/main';
import { Story, StoryDefault } from '@ladle/react';
import { Theme } from './decorators';
import './style.css';

export default {
    decorators: [Theme],
} satisfies StoryDefault;

export const ButtonOutline: Story = () => <Button variant="outlined">Hello</Button>;
export const ButtonContained: Story = () => <Button variant="contained">Hello</Button>;
export const ButtonSecondary: Story = () => (
    <Button
        variant="contained"
        color="secondary"
    >
        Hello
    </Button>
);

export const Vertical: Story = () => (
    <VerticalButton
        variant="contained"
        color="secondary"
    >
        Hello
    </VerticalButton>
);

export const Large: Story = () => (
    <LargeButton
        variant="contained"
        color="secondary"
    >
        Hello
    </LargeButton>
);

export const Busy: Story = () => (
    <BusyButton
        variant="contained"
        color="secondary"
        busy
    >
        Working...
    </BusyButton>
);
