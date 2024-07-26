import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';
import style from './style.module.css';
import { PeerStatus } from '../../hooks/peer';

interface Props {
    status?: PeerStatus;
    keepOpen?: boolean;
}

export default function ProgressDialog({ status, keepOpen }: Props) {
    const { t } = useTranslation();

    return (
        <Dialog
            hideBackdrop
            style={keepOpen ? { position: 'absolute' } : undefined}
            disablePortal={keepOpen}
            open={
                (keepOpen && status === 'ready') ||
                (status !== 'starting' && status !== 'ready' && status !== 'failed' && status !== 'inactive')
            }
        >
            <DialogTitle className={style.title}>{t('loader.titles.connecting')}</DialogTitle>
            <DialogContent className={style.content}>{t(`loader.messages.${status || 'disconnected'}`)}</DialogContent>
        </Dialog>
    );
}
