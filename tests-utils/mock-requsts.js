import nock from 'nock';

export const createGetRequest = (host, path, headers, status, response, respHeaders) => {
    nock(host)
        .get(path)
        .reply(
            status,
            response,
            respHeaders
        );
    return {
        method: 'GET',
        url: host + path,
        headers: headers
    };
};

export const createPostRequest = (host, path, body, headers, status, response, respHeaders) => {
    nock(host)
        .post(path, body)
        .reply(
            status,
            response,
            respHeaders
        );

    return {
        method: 'POST',
        url: host + path,
        body,
        headers
    };
};

export const createPutRequest = (host, path, body, headers, status, response, respHeaders) => {
    nock(host)
        .put(path, body)
        .reply(
            status,
            response,
            respHeaders
        );

    return {
        method: 'PUT',
        url: host + path,
        body,
        headers
    };
};

export const createDeleteRequest = (host, path, body, headers, status, response, respHeaders) => {
    nock(host)
        .delete(path, body)
        .reply(
            status,
            response,
            respHeaders
        );

    return {
        method: 'DELETE',
        url: host + path,
        body,
        headers
    };
};
