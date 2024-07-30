import { ContentLoader, ZipData } from '@base/main';
import { Story, StoryDefault } from '@ladle/react';
import { Theme } from './decorators';
import './style.css';

export default {
    decorators: [Theme],
} satisfies StoryDefault;

export const TestContentLoad: Story = () => (
    <ContentLoader
        content={['https://store.gen-ai.fi/somekone/imageSet1b.zip']}
        onLoad={async (d: ZipData) => {
            console.log('ZIP', d);
        }}
    />
);
