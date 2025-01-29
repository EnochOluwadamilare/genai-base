function bufToString(data: ArrayBuffer) {
    const d = new TextDecoder();
    const r = d.decode(data);
    return r;
}

function stringToBuf(data: string) {
    const d = new TextEncoder();
    const r = d.encode(data);
    return r;
}

export async function createAsym() {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-384',
        },
        true,
        ['deriveKey', 'deriveKey']
    );

    return {
        createSymCrypto: async (rkey: string) => {
            const pubKey = await crypto.subtle.importKey(
                'jwk',
                JSON.parse(rkey),
                { name: 'ECDH', namedCurve: 'P-384' },
                false,
                []
            );
            const key = await crypto.subtle.deriveKey(
                {
                    name: 'ECDH',
                    public: pubKey,
                },
                keyPair.privateKey,
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                false,
                ['encrypt', 'decrypt']
            );
            return {
                encrypt: async (data: string): Promise<[ArrayBuffer, Uint8Array]> => {
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    return [await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, stringToBuf(data)), iv];
                },
                decrypt: async (data: ArrayBuffer, iv: Uint8Array) => {
                    return bufToString(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data));
                },
            };
        },
        publicKey: JSON.stringify(await crypto.subtle.exportKey('jwk', keyPair.publicKey)),
    };
}
