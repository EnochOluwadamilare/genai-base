import { Story, StoryDefault } from '@ladle/react';
import { Theme } from './decorators';
import './style.css';
import { PieScore } from '@base/main';

export default {
    decorators: [Theme],
} satisfies StoryDefault;

export const BasicPie: Story = () => <PieScore value={0.5} />;
