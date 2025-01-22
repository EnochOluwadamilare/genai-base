import { iceConfig, webrtcActive } from '../../state/webrtcState';
import { useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { getRTConfig } from '../ConnectionMonitor/ice';
import { PeerErrorType, PeerStatus } from '../../hooks/peer';
import style from './style.module.css';
import WifiIcon from '@mui/icons-material/Wifi';
import FlashWifi from './FlashWifi';
import { useTranslation } from 'react-i18next';

interface Props {
    api: string;
    appName: string;
    ready?: boolean;
    status?: PeerStatus;
    error?: PeerErrorType;
}

export default function ConnectionStatus({ api, appName, ready, status, error }: Props) {
    const { t } = useTranslation();
    const [ice, setIce] = useRecoilState(iceConfig);
    const [webrtc, setWebRTC] = useRecoilState(webrtcActive);
    const streamRef = useRef<MediaStream | undefined>();

    // Get ICE servers
    useEffect(() => {
        if (!ice) {
            getRTConfig(api, appName, (data) => {
                setIce(data);
            });
        }
    }, [ice, setIce, api, appName]);

    useEffect(() => {
        if (status === 'starting') {
            setWebRTC('unset');
        }
    }, [status, setWebRTC]);

    // Get permissions for webRTC
    useEffect(() => {
        if (ice && webrtc === 'unset') {
            navigator?.mediaDevices
                ?.getUserMedia({ video: true })
                .then((stream) => {
                    streamRef.current = stream;
                    setWebRTC('full');
                })
                .catch(() => {
                    setWebRTC('relay');
                });
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

    const good = ready && status === 'ready' && error === 'none';

    return (
        <div className={good ? style.containerSuccess : style.container}>
            {good && (
                <WifiIcon
                    fontSize="large"
                    color="inherit"
                />
            )}
            {!good && <FlashWifi />}
            <div>{t(`loader.messages.${status}`)}</div>
        </div>
    );
}
