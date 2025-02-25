export async function checkP2P(api: string, code: string) {
    try {
        const response = await fetch(`${api}/checkP2P/${code}`);
        return response.ok;
    } catch (e) {
        return false;
    }
}
