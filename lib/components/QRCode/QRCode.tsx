import { useRef, useEffect, useState, KeyboardEvent, Suspense } from 'react';
import qr from 'qrcode';
import style from './style.module.css';
import DialogQR from './DialogQR';

interface Props {
    url: string;
    size?: 'small' | 'large' | 'normal';
    code?: string;
    label?: string;
    dialog?: boolean;
}

export default function QRCode({ url, size, code, label, dialog }: Props) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (canvas.current) {
            qr.toCanvas(canvas.current, url, { width: size === 'large' ? 350 : size === 'normal' ? 250 : 164 }).catch(
                (e) => console.error(e)
            );
        }
    }, [url, size]);

    return dialog ? (
        <div className={style.container}>
            <canvas
                aria-label="QR code, click to expand it"
                role="button"
                width={164}
                height={164}
                ref={canvas}
                onClick={() => setOpen(true)}
                tabIndex={0}
                className={style.canvas}
                data-testid="qr-code-canvas"
                onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') setOpen(true);
                }}
            />
            <Suspense>
                <DialogQR
                    url={url}
                    open={open}
                    onClose={() => setOpen(false)}
                />
            </Suspense>
        </div>
    ) : (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={style.link}
            aria-label={label}
        >
            <canvas
                data-testid="qr-code-canvas"
                width={164}
                height={164}
                ref={canvas}
            />
            {code && <div>{code}</div>}
        </a>
    );
}
