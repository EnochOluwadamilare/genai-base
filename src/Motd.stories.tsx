import { Story, StoryDefault } from '@ladle/react';
import { Theme } from './decorators';
import './style.css';
import Motd from '@base/components/Motd/Motd';

export default {
    decorators: [Theme],
} satisfies StoryDefault;

export const MOTDInfo: Story = () => <Motd message="Some empty message" />;

export const MOTDWarn: Story = () => <Motd message="warn:Some empty message" />;

export const MOTDError: Story = () => <Motd message="error:Some empty message" />;

export const MOTDFetch: Story = () => <Motd />;
