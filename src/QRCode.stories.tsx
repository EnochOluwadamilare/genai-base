import { QRCode } from '@base/main';
import { Story, StoryDefault } from '@ladle/react';
import { Theme } from './decorators';
import './style.css';

export default {
    decorators: [Theme],
} satisfies StoryDefault;

export const Small: Story = () => (
    <QRCode
        url="https://news.bbc.co.uk"
        size="small"
    />
);

export const Normal: Story = () => (
    <QRCode
        url="https://news.bbc.co.uk"
        size="normal"
    />
);

export const Large: Story = () => (
    <QRCode
        url="https://news.bbc.co.uk"
        size="large"
    />
);
