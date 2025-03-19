import { Webcam } from '@base/main';
import { Story, StoryDefault } from '@ladle/react';
import { Theme } from './decorators';
import './style.css';

export default {
    decorators: [Theme],
} satisfies StoryDefault;

export const WebcamStory: Story = () => <Webcam size={128} />;

function postProcess(image: HTMLCanvasElement) {
    const ctx = image.getContext('2d');
    if (!ctx) {
        return;
    }
    ctx.rect(10, 10, 100, 100);
    ctx.fillStyle = 'red';
    ctx.fill();
}

export const WebcamPostStory: Story = () => (
    <Webcam
        size={128}
        onPostprocess={postProcess}
    />
);
