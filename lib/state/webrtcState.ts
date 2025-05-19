import { CommunicationRelayConfiguration } from '../components/ConnectionStatus/ice';
import { atom } from 'jotai';

type WebRTCPermissions = 'disabled' | 'unset' | 'full' | 'relay';

export const webrtcActive = atom<WebRTCPermissions>('disabled');

export const iceConfig = atom<CommunicationRelayConfiguration | undefined>(undefined);

export const webrtcCandidate = atom<'unset' | 'relay' | 'other'>('unset');
