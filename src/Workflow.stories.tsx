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

export const WorkflowOffsets: Story = () => (
    <WorkflowLayout
        connections={[
            { start: 'w1', end: 'w2', startPoint: 'right', endPoint: 'left', startOffset: -0.5, endOffset: 0.5 },
        ]}
    >
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

export const WorkflowSpaced: Story = () => (
    <WorkflowLayout
        connections={[
            { start: 'w1', end: 'w2', startPoint: 'right', endPoint: 'left', startOffset: -0.5, endOffset: 0.5 },
        ]}
    >
        <Widget
            dataWidget="w1"
            title="Test 1"
            headerColour="pink"
            style={{ marginRight: '100px' }}
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

export const WorkflowAnnotated: Story = () => (
    <WorkflowLayout
        connections={[
            {
                start: 'w1',
                end: 'w2',
                startPoint: 'right',
                endPoint: 'left',
                startOffset: -0.5,
                endOffset: 0.5,
                annotationElement: (
                    <div
                        style={{
                            background: 'white',
                            padding: '2px 5px',
                            border: '1px solid black',
                            borderRadius: '3px',
                        }}
                    >
                        Annotation
                    </div>
                ),
            },
        ]}
    >
        <Widget
            dataWidget="w1"
            title="Test 1"
            headerColour="pink"
            style={{ marginRight: '100px' }}
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
