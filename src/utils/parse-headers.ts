import type { DefaultHeaders } from 'fastify';
import type { Response } from 'node-fetch';

export const hasContentTypeJson = (headers: DefaultHeaders) => {
    if (headers && headers['content-type'] && headers['content-type'].includes('application/json')) return true;
    return false;
};

export const parseHeadersFromFetch = (response: Response): DefaultHeaders => Object.keys(response.headers.raw()).reduce(
    (headers, key) => {
        headers[key] = response.headers.get(key);
        return headers;
    },
    {}
);
