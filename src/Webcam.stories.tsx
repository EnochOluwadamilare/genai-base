import { Webcam } from '@base/main';
import { Story, StoryDefault } from '@ladle/react';
import { Theme } from './decorators';
import './style.css';

export default {
    decorators: [Theme],
} satisfies StoryDefault;

export const WebcamStory: Story = () => <Webcam size={128} />;
