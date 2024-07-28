import { useState, useEffect, useRef, useCallback } from 'react';
import style from './webcam.module.css';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@mui/material';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import { useSetRecoilState } from 'recoil';
import { fatalWebcam } from '@base/state/webrtcState';
import { WebcamClass } from './webcamClass';

interface Props {
    interval?: number;
    capture?: boolean;
    disable?: boolean;
    onCapture?: (image: HTMLCanvasElement) => void | Promise<void>;
    onPreprocess?: (image: HTMLCanvasElement) => void | Promise<void>;
    onPostprocess?: (image: HTMLCanvasElement) => void | Promise<void>;
    onActivated?: (available: boolean) => void;
    direct?: boolean;
    hidden?: boolean;
    size: number;
}

export default function Webcam({
    interval,
    capture,
    onCapture,
    disable,
    direct,
    hidden,
    onPreprocess,
    onPostprocess,
    onActivated,
    size,
}: Props) {
    const { t } = useTranslation();
    const [webcam, setWebcam] = useState<WebcamClass | null>(null);
    const webcamRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef(-1);
    const previousTimeRef = useRef(0);
    const loopRef = useRef<(n: number) => Promise<void>>();
    const [multiple, setMultiple] = useState(false);
    const [facing, setFacing] = useState(false);
    //const [, setWebtRTCActive] = useRecoilState(webrtcActive);
    const setFatalWebcam = useSetRecoilState(fatalWebcam);

    useEffect(() => {
        loopRef.current = async (timestamp: number) => {
            if (disable) {
                if (loopRef.current) {
                    requestRef.current = window.requestAnimationFrame(loopRef.current);
                }
                return;
            }
            if (webcam && webcam.canvas) {
                webcam.update();
                const actualInterval = interval !== undefined ? interval : 1000.0;

                if (onPreprocess) {
                    await onPreprocess(webcam.canvas);
                }

                if (capture && onCapture && timestamp - previousTimeRef.current >= actualInterval) {
                    if (direct && webcam.canvas) {
                        await onCapture(webcam.canvas);
                    } else {
                        const newImage = document.createElement('canvas');
                        newImage.width = webcam.canvas.width;
                        newImage.height = webcam.canvas.height;
                        const context = newImage.getContext('2d');
                        if (!context) console.error('Failed to get context');
                        context?.drawImage(webcam.canvas, 0, 0);
                        await onCapture(newImage);
                    }
                    previousTimeRef.current = timestamp;
                }

                if (onPostprocess) {
                    await onPostprocess(webcam.canvas);
                }

                const ctx = webcamRef.current?.getContext('2d');
                if (ctx) {
                    ctx.drawImage(webcam.canvas, 0, 0);
                }
            }

            if (loopRef.current) {
                requestRef.current = window.requestAnimationFrame(loopRef.current);
            }
        };

        if (requestRef.current === -1) {
            requestRef.current = window.requestAnimationFrame(loopRef.current);
        }
    }, [webcam, interval, capture, onCapture, direct, disable, onPostprocess, onPreprocess]);

    const initWebcam = useCallback(
        async (newWebcam: WebcamClass) => {
            await newWebcam.setup({ facingMode: facing ? 'user' : 'environment' });
            //setWebtRTCActive(true);
            if (newWebcam.webcam) {
                newWebcam.webcam.playsInline = true;
                newWebcam.webcam.muted = true;
                newWebcam.webcam.onsuspend = () => newWebcam.play();
                setWebcam(newWebcam);
            }

            if (navigator.mediaDevices?.enumerateDevices) {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDev = devices.filter((d) => d.kind === 'videoinput');
                    if (videoDev.length > 1) {
                        if (!multiple) setMultiple(true);
                        newWebcam.flip = facing;
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            if (onActivated) onActivated(true);
            return newWebcam;
        },
        [onActivated, facing, multiple]
    );

    useEffect(() => {
        if (capture) previousTimeRef.current = 0;
    }, [capture]);

    useEffect(() => {
        const camera = new WebcamClass(size, size, true);
        initWebcam(camera).catch((e) => {
            if (onActivated) onActivated(false);
            console.error('No webcam', e);
            setFatalWebcam(true);
        });
        return () => {
            if (camera.webcam?.srcObject) {
                camera.stop();
            }
        };
    }, [facing, onActivated, initWebcam, setFatalWebcam, size]);

    useEffect(() => {
        return () => {
            loopRef.current = undefined;
            if (webcam?.webcam?.srcObject) {
                webcam.stop();
            }
        };
    }, [webcam]);

    useEffect(() => {
        if (webcam) {
            if (disable) {
                webcam.pause();
            } else {
                webcam.play();
            }
        }
    }, [webcam, disable]);

    const doFlip = useCallback(() => {
        setFacing((f) => !f);
    }, [setFacing]);

    return hidden ? (
        <>
            {multiple && (
                <IconButton
                    size="large"
                    color="inherit"
                    onClick={doFlip}
                    aria-label={t('webcam.aria.flip')}
                >
                    <CameraswitchIcon fontSize="large" />
                </IconButton>
            )}
        </>
    ) : (
        <>
            {!webcam && (
                <Skeleton
                    variant="rounded"
                    width={size}
                    height={size}
                />
            )}
            {webcam && (
                <div className={style.wrapContainer}>
                    {multiple && (
                        <IconButton
                            className={style.flipButton}
                            size="large"
                            color="inherit"
                            onClick={doFlip}
                            aria-label={t('webcam.aria.flip')}
                        >
                            <CameraswitchIcon fontSize="large" />
                        </IconButton>
                    )}
                    <div
                        data-testid="webcam"
                        className={style.container}
                        role="img"
                        aria-label={t('webcam.aria.video')}
                    >
                        <canvas
                            width={size}
                            height={size}
                            ref={webcamRef}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
