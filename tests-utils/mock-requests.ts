import nock from 'nock';
export const createGetRequest = (host: string, path: string, headers: {[key:string]: string}|undefined, status: number, response: any, respHeaders: {[key:string]: string}) => {
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

export const createPostRequest = (host: string, path: string, body: any, headers: {[key:string]: string}|undefined, status: number, response: any, respHeaders: {[key:string]: string}) => {
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

export const createPutRequest = (host: string, path: string, body: any, headers: {[key:string]: string}|undefined, status: number, response: any, respHeaders:{[key:string]: string}) => {
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

export const createDeleteRequest = (host: string, path: string, body: any, headers: {[key:string]: string}|undefined, status: number, response: any, respHeaders: {[key:string]: string}) => {
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
