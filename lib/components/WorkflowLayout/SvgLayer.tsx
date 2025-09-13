import style from './style.module.css';

export interface ILine {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    direction: 'horizontal' | 'vertical';
    id1: string;
    id2: string;
    annotationElement?: React.ReactNode;
}

interface Props {
    lines: ILine[];
}

const CURVE = 0.4;
const ANNOTATION_PADDING = 40;

export default function SvgLayer({ lines }: Props) {
    // const activeLines = useRecoilValue(activeNodes);

    return (
        <svg
            className={style.svglayer}
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            aria-hidden
        >
            {lines.map((line, ix) => {
                const dx = line.direction === 'horizontal' ? Math.abs(line.x1 - line.x2) * CURVE : 0;
                const dy = line.direction === 'vertical' ? Math.abs(line.y1 - line.y2) * CURVE : 0;
                const size = Math.max(Math.abs(line.x1 - line.x2), Math.abs(line.y1 - line.y2));
                const active = true; // activeLines.has(`${line.id1}-out`) && activeLines.has(`${line.id2}-in`);
                return (
                    <g key={`annotation-${ix}`}>
                        <path
                            data-testid={`line-${line.id1}-${line.id2}`}
                            key={ix}
                            d={`M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1 + dy}, ${line.x2 - dx} ${
                                line.y2 - dy
                            }, ${line.x2} ${line.y2}`}
                            fill="none"
                            stroke={active ? 'rgb(174, 37, 174)' : '#7C828D'}
                            strokeWidth="2"
                            strokeDasharray={active ? undefined : '4 4'}
                        />
                        {line.annotationElement && (
                            <foreignObject
                                x={(line.x1 + line.x2) / 2 - (size - ANNOTATION_PADDING) / 2}
                                y={(line.y1 + line.y2) / 2 - (size - ANNOTATION_PADDING) / 2}
                                width={size - ANNOTATION_PADDING}
                                height={size - ANNOTATION_PADDING}
                            >
                                <div className={style.annotation}>{line.annotationElement}</div>
                            </foreignObject>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}
