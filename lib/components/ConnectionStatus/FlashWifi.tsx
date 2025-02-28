import { useEffect, useState } from 'react';
import SignalWifi0BarIcon from '@mui/icons-material/SignalWifi0Bar';
import WifiIcon from '@mui/icons-material/Wifi';

export default function FlashWifi() {
    const [on, setOn] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setOn((old) => !old), 1000);
        return () => {
            clearInterval(t);
        };
    }, []);

    return on ? (
        <WifiIcon
            fontSize="large"
            color="inherit"
        />
    ) : (
        <SignalWifi0BarIcon
            fontSize="large"
            color="inherit"
        />
    );
}
