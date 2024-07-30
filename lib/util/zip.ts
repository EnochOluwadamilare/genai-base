import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function getZipBlob(
    content: string | ArrayBuffer | File,
    progress?: (percent: number) => void
): Promise<Blob> {
    if (typeof content === 'string') {
        if (progress) progress(0);

        const result = await fetch(content);
        if (result.status !== 200) {
            console.error(result);
            throw new Error('zip_fetch_failed');
        }
        const parts: BlobPart[] = [];

        if (result.body) {
            const reader = result.body.getReader();

            const contentLength = parseInt(result.headers.get('Content-Length') || '1');

            let receivedLength = 0;

            while (receivedLength < contentLength) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                parts.push(value);
                receivedLength += value.length;
                if (progress) progress(Math.floor((receivedLength / contentLength) * 100));
            }
        }

        return new Blob(parts);
    } else if (content instanceof File) {
        const buffer = await content.arrayBuffer();
        if (progress) progress(100);
        return new Blob([buffer]);
    } else {
        if (progress) progress(100);
        return new Blob([content]);
    }
}

export interface ZipData {
    [key: string]: unknown;
    images?: Map<string, string>;
}

export async function loadZipFile(file: File | Blob | ArrayBuffer | string): Promise<ZipData> {
    const blob = file instanceof Blob ? file : getZipBlob(file);
    const zip = await JSZip.loadAsync(blob);

    const result: ZipData = {};
    const promises: Promise<void>[] = [];

    zip.forEach((_, data: JSZip.JSZipObject) => {
        if (/\.json$/.test(data.name)) {
            promises.push(
                data.async('string').then((s) => {
                    const name = data.name.replace('.json', '');
                    result[name] = JSON.parse(s);
                })
            );
        } else if (/\.bin$/.test(data.name)) {
            promises.push(
                data.async('arraybuffer').then((s) => {
                    const name = data.name.replace('.bin', '');
                    result[name] = s;
                })
            );
        } else {
            const parts = data.name.split('/');
            if (parts.length === 2 && !!parts[1] && (parts[0] === 'images' || parts[0] === 'samples')) {
                result.images = new Map<string, string>();
                const split1 = parts[1].split('.');
                if (split1.length === 2) {
                    promises.push(
                        data.async('base64').then((s) => {
                            result.images?.set(
                                split1[0],
                                `data:image/${split1[1] === 'png' ? 'png' : 'jpeg'};base64,${s}`
                            );
                        })
                    );
                }
            }
        }
    });

    await Promise.all(promises);
    return result;
}

type ZipOutput<T extends JSZip.OutputType> = ReturnType<typeof JSZip.prototype.generateAsync<T>>;

export async function createZip<T extends JSZip.OutputType>(type: T, data: ZipData): Promise<ZipOutput<T>> {
    const zip = new JSZip();

    if (data.images) {
        const imageFolder = zip.folder('images');

        if (imageFolder) {
            data.images.forEach((content, name) => {
                const typeSplit = content.split(';base64,');
                imageFolder.file(`${name}.${typeSplit[0] === 'png' ? 'png' : 'jpg'}`, typeSplit[1], { base64: true });
            });
        }
    }

    for (const key in data) {
        if (key === 'images') continue;
        const d = data[key];
        if (d instanceof ArrayBuffer) {
            zip.file(`${key}.bin`, d);
        } else {
            zip.file(`${key}.json`, JSON.stringify(data[key], undefined, 4));
        }
    }

    return zip.generateAsync<T>({ type });
}

export async function createZipBlob(data: ZipData): Promise<Blob> {
    return createZip('blob', data);
}

export async function createZipArrayBuffer(data: ZipData): Promise<ArrayBuffer> {
    return createZip('arraybuffer', data);
}

export async function saveZipFile(data: ZipData, name?: string) {
    const blob = await createZipBlob(data);
    saveAs(blob, `${name || 'data'}.zip`);
    return blob;
}
