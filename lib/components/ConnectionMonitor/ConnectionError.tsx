import { PeerErrorType } from '../../hooks/peer';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';
import style from './style.module.css';
import { useEffect, useState } from 'react';

interface Props {
    hasError?: boolean;
    error?: PeerErrorType;
}

export default function ConnectionError({ hasError, error }: Props) {
    const { t } = useTranslation();
    const [forceClose, setForceClose] = useState(false);

    useEffect(() => {
        setForceClose(false);
    }, [hasError, error]);

    return (
        <Dialog
            hideBackdrop
            open={(hasError && error && error !== 'none' && !forceClose) || false}
        >
            <DialogTitle className={style.errorTitle}>{t('loader.titles.error')}</DialogTitle>
            <DialogContent className={style.errorContent}>
                <div>{t(`loader.errors.${error}`, { defaultValue: t('loader.errors.unknown') })}</div>
            </DialogContent>
        </Dialog>
    );
}
