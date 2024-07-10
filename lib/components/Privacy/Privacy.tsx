import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import logo from './github-mark-white.svg';

interface Props {
    tag: string;
    appName: string;
}

export default function Privacy({ tag, appName }: Props) {
    const { t } = useTranslation();

    return (
        <section className={style.policy}>
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
            <a
                href="/about"
                target="_blank"
            >
                {t('about.privacyTitle')}
            </a>
        </section>
    );
}
