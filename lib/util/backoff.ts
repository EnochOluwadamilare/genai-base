const MAX_BACKOFF = 3;
const BASE_RETRY_TIME = 1000;

export function expBackoff(count: number) {
    return Math.pow(2, Math.min(count, MAX_BACKOFF)) * BASE_RETRY_TIME;
}
