import { NativeSelect } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import style from './style.module.css';
import LanguageIcon from '@mui/icons-material/Language';

export const LANGS = [
    { name: 'en', label: 'English' },
    { name: 'fi', label: 'Suomi' },
];

interface Props {
    languages?: { name: string; label: string }[];
}

export default function LangSelect({ languages = LANGS }: Props) {
    const { t, i18n } = useTranslation();
    const doChangeLanguage = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            i18n.changeLanguage(e.target.value || 'en');
        },
        [i18n]
    );

    return (
        <div className={style.lang}>
            <NativeSelect
                value={i18n.language}
                onChange={doChangeLanguage}
                variant="outlined"
                data-testid="select-lang"
                inputProps={{ 'aria-label': t('app.language', { ns: 'common' }) }}
            >
                {languages.map((lng) => (
                    <option
                        key={lng.name}
                        value={lng.name}
                    >
                        {lng.label}
                    </option>
                ))}
            </NativeSelect>
            <LanguageIcon />
        </div>
    );
}
