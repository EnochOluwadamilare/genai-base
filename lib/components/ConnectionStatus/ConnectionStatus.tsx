import { iceConfig, webrtcActive } from '../../state/webrtcState';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { getRTConfig } from './ice';
import style from './style.module.css';
import WifiIcon from '@mui/icons-material/Wifi';
import FlashWifi from './FlashWifi';
import { useTranslation } from 'react-i18next';
import { PeerStatus } from '@base/services/peer2peer/types';
import SignalWifiBadIcon from '@mui/icons-material/SignalWifiBad';
import { checkP2P } from './check';
import { usePeerObject } from '@base/hooks/peer';

const FAILURE_TIMEOUT = 60000;

interface Props {
    api: string;
    appName: string;
    visibility?: number;
    noCheck?: boolean;
}

export default function ConnectionStatus({ api, appName, visibility, noCheck }: Props) {
    const { t } = useTranslation();
    const peer = usePeerObject();
    const [ice, setIce] = useAtom(iceConfig);
    const [webrtc, setWebRTC] = useAtom(webrtcActive);
    const streamRef = useRef<MediaStream | undefined>();
    const [status, setStatus] = useState<PeerStatus>('connecting');
    const [quality, setQuality] = useState(0);
    const [, setP2PCheck] = useState(false);
    //const [error, setError] = useState<PeerErrorType>('none');
    const [failed, setFailed] = useState(false);

    const ready = status === 'ready';

    useEffect(() => {
        if (peer) {
            peer.on('status', setStatus);
            peer.on('quality', setQuality);
            setStatus(peer.status);
            setQuality(peer.quality);

            return () => {
                peer.off('status', setStatus);
                peer.off('quality', setQuality);
            };
        } else {
            setQuality(0);
            setStatus('connecting');
        }
    }, [peer]);

    // Get ICE servers
    useEffect(() => {
        if (!ice) {
            getRTConfig(api, appName, (data) => {
                setIce(data);
            });
        }
    }, [ice, setIce, api, appName]);

    useEffect(() => {
        if (status !== 'ready') {
            const t = setTimeout(() => {
                setFailed(true);
            }, FAILURE_TIMEOUT);
            return () => {
                clearTimeout(t);
            };
        } else {
            setFailed(false);
        }
    }, [status]);

    // Get permissions for webRTC
    useEffect(() => {
        if (ice && webrtc === 'unset') {
            if (navigator?.mediaDevices) {
                navigator.mediaDevices
                    .getUserMedia({ video: true })
                    .then((stream) => {
                        streamRef.current = stream;
                        setWebRTC('full');
                    })
                    .catch(() => {
                        setWebRTC('relay');
                    });
                // Happens if in non-secure context
            } else {
                setWebRTC('relay');
            }
        }
    }, [ice, webrtc, setWebRTC]);

    // Stop the webcam after connection is ready (for Firefox)
    useEffect(() => {
        if (ready && streamRef.current) {
            streamRef.current.getTracks().forEach(function (track) {
                track.stop();
            });
            streamRef.current = undefined;
        }
    }, [ready, status]);

    useEffect(() => {
        if (ready && peer && !noCheck && peer.code) {
            checkP2P(api, peer.code).then((res) => {
                setP2PCheck(res);
            });
        }
    }, [ready, peer, api, noCheck]);

    return (
        <>
            {(visibility === undefined || quality <= visibility) && (
                <div
                    className={
                        status === 'connecting' && !failed
                            ? style.containerConnecting
                            : quality === 3
                            ? style.containerSuccess
                            : quality === 2
                            ? style.containerMedium
                            : style.containerBad
                    }
                >
                    {!failed && quality > 0 && (
                        <WifiIcon
                            fontSize="large"
                            color="inherit"
                        />
                    )}
                    {!failed && quality <= 0 && <FlashWifi />}
                    {failed && (
                        <SignalWifiBadIcon
                            fontSize="large"
                            color="inherit"
                        />
                    )}
                    <div className={style.message}>
                        {ready
                            ? t(`loader.messages.quality${quality}`)
                            : failed
                            ? t('loader.messages.failed')
                            : t(`loader.messages.${status}`)}
                    </div>
                </div>
            )}
        </>
    );
}
