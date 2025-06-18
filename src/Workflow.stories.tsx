import { Story, StoryDefault } from '@ladle/react';
import { Theme } from './decorators';
import './style.css';
import { Widget, WorkflowLayout } from '@base/main';

export default {
    decorators: [Theme],
} satisfies StoryDefault;

export const Workflow1: Story = () => (
    <WorkflowLayout connections={[{ start: 'w1', end: 'w2', startPoint: 'right', endPoint: 'left' }]}>
        <Widget
            dataWidget="w1"
            title="Test 1"
            headerColour="pink"
        >
            Hello
        </Widget>
        <Widget
            dataWidget="w2"
            title="Test 2"
        >
            World
        </Widget>
    </WorkflowLayout>
);
