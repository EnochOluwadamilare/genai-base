import { iceConfig, webrtcActive } from '../../state/webrtcState';
import { useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import PermissionDialog from './PermissionDialog';
import { getRTConfig } from './ice';
import IceDialog from './IceDialog';
import ConnectionError from './ConnectionError';
import { PeerErrorType, PeerStatus } from '../../hooks/peer';
import ProgressDialog from './ProgressDialog';

interface Props {
    api: string;
    appName: string;
    ready?: boolean;
    status?: PeerStatus;
    error?: PeerErrorType;
    keepOpen?: boolean;
}

export default function ConnectionMonitor({ api, appName, ready, status, error, keepOpen }: Props) {
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

    return (
        <>
            <IceDialog open={!ice} />
            <PermissionDialog open={ice && webrtc === 'unset'} />
            <ProgressDialog
                status={status}
                keepOpen={keepOpen}
            />
            <ConnectionError
                error={error}
                hasError={status === 'failed'}
            />
        </>
    );
}
