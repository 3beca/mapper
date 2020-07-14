import type { Response } from 'node-fetch';
import type { IncomingHttpHeaders } from 'http';

export const hasContentTypeJson = (headers: IncomingHttpHeaders) => {
    if (headers && headers['content-type'] && headers['content-type'].includes('application/json')) return true;
    return false;
};

export const parseHeadersFromFetch = (response: Response): IncomingHttpHeaders => Object.keys(response.headers.raw()).reduce(
    (headers, key) => {
        headers[key] = response.headers.get(key);
        return headers;
    },
    {}
);
