import { CommunicationRelayConfiguration } from '../components/ConnectionStatus/ice';
import { atom } from 'recoil';

type WebRTCPermissions = 'disabled' | 'unset' | 'full' | 'relay';

export const webrtcActive = atom<WebRTCPermissions>({
    key: 'webrtc',
    default: 'disabled',
});

export const iceConfig = atom<CommunicationRelayConfiguration | undefined>({
    key: 'iceConfig',
    default: undefined,
});

export const webrtcCandidate = atom<'unset' | 'relay' | 'other'>({
    key: 'webrtccandidate',
    default: 'unset',
});
