import fetch from 'node-fetch';
import {
    hasContentTypeJson,
    parseHeadersFromFetch
} from '../utils/parse-headers';

export const requester = async (requests) => {
    if (!requests) return [];
    const requestsPromises = requests.map((request) => {
        const method = request.method || 'GET';
        const body = (method === 'GET' || method === 'HEAD') ? undefined : request.body;
        const headers = request.headers;
        return fetch(
            request.url,
            {
                method,
                body,
                headers: {
                    ...headers,
                    'user-agent': 'tribeca-mapper'
                }
            }
        );
    });
    const responsesPromises = await Promise.all(requestsPromises);
    const responses = [];
    for (let i = 0; i < responsesPromises.length; i++) {
        const response = responsesPromises[i];
        const statusResponse = response.status;
        const headersResponse = parseHeadersFromFetch(response);
        const bodyResponse = hasContentTypeJson(headersResponse) ? await response.json() : await response.text();
        responses.push({
            request: requests[i],
            response: {
                status: statusResponse,
                headers: headersResponse,
                body: bodyResponse
            }
        });
    }
    return responses;
};

export const requesterSerial = async (requests) => {
    if (!requests) return [];
    const responses = [];
    for (const request of requests) {
        const method = request.method || 'GET';
        const body = (method === 'GET' || method === 'HEAD') ? undefined : request.body;
        const headers = request.headers;
        const response = await fetch(
            request.url,
            {
                method,
                body,
                headers: {
                    ...headers,
                    'user-agent': 'tribeca-mapper'
                }
            }
        );
        const statusResponse = response.status;
        const headersResponse = parseHeadersFromFetch(response);
        const bodyResponse = hasContentTypeJson(headersResponse) ? await response.json() : await response.text();
        responses.push({
            request,
            response: {
                status: statusResponse,
                headers: headersResponse,
                body: bodyResponse
            }
        });
    }
    return responses;
};

export const buildRequesterService = () => ({requester, requesterSerial});

export default buildRequesterService;
