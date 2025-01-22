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

export function getRTConfig(api: string, appName: string, resolve: (value: CommunicationRelayConfiguration) => void) {
    fetch(`${api}/rtcconfig?appName=${appName}`)
        .then((response) => {
            console.log('rtcconfig response', response);
            if (response.ok) {
                response.json().then(resolve);
            } else setTimeout(() => getRTConfig(api, appName, resolve), 1000);
        })
        .catch(() => {
            setTimeout(() => getRTConfig(api, appName, resolve), 1000);
        });
}
