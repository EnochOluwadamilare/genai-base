import style from './style.module.css';

interface Props {
    size?: 'small' | 'large';
    disabled?: boolean;
}

export default function Spinner({ size, disabled }: Props) {
    return (
        <div
            className={`${size === 'large' ? style.largeSpinner : style.spinner} ${
                disabled ? style.disabled : style.animated
            }`}
        >
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
}
