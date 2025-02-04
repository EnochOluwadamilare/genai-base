import { useEffect, useMemo, useState } from 'react';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

interface Props {
    message?: string;
}

type MotdLevel = 'info' | 'warn' | 'error';

export default function Motd({ message }: Props) {
    const [msg, setMsg] = useState(message || '');
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!message) {
            fetch(`${import.meta.env.VITE_APP_APIURL}/motd`)
                .then((response) => {
                    if (response.ok) {
                        response.json().then((s) => {
                            if (s && s.motd) {
                                setMsg(s.motd);
                            }
                        });
                    }
                })
                .catch(() => {
                    console.warn('MOTD Failed');
                });
        }
    }, [message]);

    const levelMsg = useMemo<{ msg: string; level: MotdLevel }>(() => {
        if (msg.startsWith('info:')) {
            return { msg: msg.substring(5), level: 'info' };
        } else if (msg.startsWith('warn:')) {
            return { msg: msg.substring(5), level: 'warn' };
        } else if (msg.startsWith('error:')) {
            return { msg: msg.substring(6), level: 'error' };
        }
        return { msg, level: 'info' };
    }, [msg]);

    return msg.length > 0 && visible ? (
        <div className={style[levelMsg.level]}>
            <div style={{ flexGrow: 1 }}>{levelMsg.msg}</div>
            <IconButton
                color="inherit"
                onClick={() => setVisible(false)}
            >
                <CloseIcon
                    fontSize="large"
                    color="inherit"
                />
            </IconButton>
        </div>
    ) : null;
}
