export async function bytesToBase64(bytes: BlobPart, type = 'application/octet-stream'): Promise<string> {
    return await new Promise((resolve, reject) => {
        const reader = Object.assign(new FileReader(), {
            onload: () => {
                const r = reader.result as string;
                const i = r.indexOf(',');
                const data = r.substring(i + 1);
                resolve(data);
            },
            onerror: () => reject(reader.error),
        });
        reader.readAsDataURL(new File([bytes], '', { type }));
    });
}

export async function base64ToBytes(data: string) {
    const res = await fetch(`data:application/octet-stream;base64,${data}`);
    return await res.arrayBuffer();
}
