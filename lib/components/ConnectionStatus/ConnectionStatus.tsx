import { iceConfig, webrtcActive } from '../../state/webrtcState';
import { useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil';
import { getRTConfig } from './ice';
import style from './style.module.css';
import WifiIcon from '@mui/icons-material/Wifi';
import FlashWifi from './FlashWifi';
import { useTranslation } from 'react-i18next';
import { PeerEvent, PeerStatus } from '@base/services/peer2peer/types';
import Peer2Peer from '@base/services/peer2peer/Peer2Peer';
import SignalWifiBadIcon from '@mui/icons-material/SignalWifiBad';

const FAILURE_TIMEOUT = 20000;

interface Props {
    api: string;
    appName: string;
    ready?: boolean;
    peer?: Peer2Peer<PeerEvent>;
    visibility?: number;
    noCheck?: boolean;
}

export default function ConnectionStatus({ api, appName, ready, peer, visibility, noCheck }: Props) {
    const { t } = useTranslation();
    const [ice, setIce] = useRecoilState(iceConfig);
    const [webrtc, setWebRTC] = useRecoilState(webrtcActive);
    const streamRef = useRef<MediaStream | undefined>();
    const [status, setStatus] = useState<PeerStatus>('connecting');
    const [quality, setQuality] = useState(0);
    const [, setP2PCheck] = useState(false);
    //const [error, setError] = useState<PeerErrorType>('none');
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (peer) {
            peer.on('status', setStatus);
            peer.on('quality', setQuality);
            //peer.on('error', setError);
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
        /*if (status === 'connecting') {
            setWebRTC('unset');
        }*/
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
    }, [status, setWebRTC]);

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
        if (ready && peer && !noCheck) {
            fetch(`${api}/checkP2P/${peer.code}`)
                .then((res) => {
                    if (res.ok) {
                        setP2PCheck(true);
                    } else {
                        setP2PCheck(false);
                    }
                })
                .catch(() => {
                    setP2PCheck(false);
                });
        }
    }, [ready, peer, api, noCheck]);

    return (
        <>
            {(visibility === undefined || quality <= visibility) && (
                <div
                    className={
                        quality === 3
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
