import { Privacy } from '@base/main';
import { Story, StoryDefault } from '@ladle/react';
import { Theme } from './decorators';
import './style.css';

export default {
    decorators: [Theme],
} satisfies StoryDefault;

export const PrivacyButton: Story = () => (
    <Privacy
        appName="test"
        tag="v1"
        position="topRight"
    />
);
