import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { extractNodesFromElements, generateLines, IConnection } from './lines';
import SvgLayer, { ILine } from './SvgLayer';
import style from './style.module.css';

interface Props extends PropsWithChildren {
    connections: IConnection[];
}

export default function WorkflowLayout({ children, connections }: Props) {
    const [lines, setLines] = useState<ILine[]>([]);
    const wkspaceRef = useRef<HTMLDivElement>(null);
    const observer = useRef<ResizeObserver>();

    useEffect(() => {
        if (wkspaceRef.current) {
            const f = () => {
                if (wkspaceRef.current) {
                    const nodes = extractNodesFromElements(wkspaceRef.current as HTMLElement);
                    const lines = generateLines(nodes, connections);

                    setLines(lines);
                }
            };
            observer.current = new ResizeObserver(f);
            observer.current.observe(wkspaceRef.current);
            const children = wkspaceRef.current.children;
            if (children) {
                for (let i = 0; i < children.length; ++i) {
                    const child = children[i];
                    observer.current.observe(child);
                }
            }

            f();

            return () => {
                observer.current?.disconnect();
            };
        }
    }, [connections]);

    return (
        <div className={style.workspace}>
            <div
                className={style.container}
                ref={wkspaceRef}
                style={{
                    gridTemplateColumns: `repeat(${
                        Array.isArray(children) ? children.filter((c) => !!c).length : 1
                    }, max-content)`,
                }}
            >
                <SvgLayer lines={lines} />
                {children}
            </div>
        </div>
    );
}
