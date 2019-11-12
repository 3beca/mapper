export const hasContentTypeJson = (headers) => {
    if (headers && headers['content-type'] && headers['content-type'].includes('application/json')) return true;
    return false;
};

export const parseHeadersFromFetch = (response) => Object.keys(response.headers.raw()).reduce(
    (headers, key) => {
        headers[key] = response.headers.get(key);
        return headers;
    },
    {}
);
