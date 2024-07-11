import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import logo from './github-mark-white.svg';

interface Props {
    position?: 'bottomLeft' | 'topRight';
    tag: string;
    appName: string;
}

export default function Privacy({ tag, appName, position = 'bottomLeft' }: Props) {
    const { t } = useTranslation();

    return (
        <section className={`${style.policy} ${style[position]}`}>
            {position === 'topRight' && (
                <a
                    href="/about"
                    target="_blank"
                >
                    {t('about.privacyTitle')}
                </a>
            )}
            <div
                aria-hidden
                className={style.versionBox}
            >
                <a
                    href={`https://github.com/knicos/genai-${appName}/releases/tag/${tag}`}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="versionlink"
                >
                    <img
                        src={logo}
                        width={24}
                        height={24}
                        alt="Github source"
                    />
                </a>
            </div>
            {position === 'bottomLeft' && (
                <a
                    href="/about"
                    target="_blank"
                >
                    {t('about.privacyTitle')}
                </a>
            )}
        </section>
    );
}
