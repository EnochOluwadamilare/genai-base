import { expBackoff } from '@base/util/backoff';

type RouteType = 'any' | 'nearest';

export interface CommunicationIceServer {
    urls: string[];
    username: string;
    credential: string;
    routeType: RouteType;
}

export interface CommunicationRelayConfiguration {
    expiresOn: Date;
    iceServers: CommunicationIceServer[];
}

let retryCount = 0;

export function getRTConfig(api: string, appName: string, resolve: (value: CommunicationRelayConfiguration) => void) {
    fetch(`${api}/rtcconfig?appName=${appName}`)
        .then((response) => {
            if (response.ok) {
                retryCount = 0;
                response.json().then(resolve);
            } else setTimeout(() => getRTConfig(api, appName, resolve), expBackoff(retryCount++, 5));
        })
        .catch(() => {
            setTimeout(() => getRTConfig(api, appName, resolve), expBackoff(retryCount++, 5));
        });
}
