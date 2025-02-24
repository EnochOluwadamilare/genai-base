const MAX_BACKOFF = 3;
const BASE_RETRY_TIME = 1000;

export function expBackoff(count: number, max = MAX_BACKOFF) {
    return Math.pow(2, Math.min(count, max)) * BASE_RETRY_TIME;
}
