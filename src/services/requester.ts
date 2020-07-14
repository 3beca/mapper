import fetch, { Response } from 'node-fetch';
import {
    hasContentTypeJson,
    parseHeadersFromFetch
} from '../utils/parse-headers';
import { logger } from '../utils/logger';
import { SourceTransformed } from './http-engine';
import type { IncomingHttpHeaders } from 'http';

const responseJson = async (response: Response): Promise<any> => {
    try {
        return await response.json();
    }
    catch (error) {
        // console.log('Response error', error);
        return '';
    }
};

export type RequesterResponse = {
    request: SourceTransformed;
    response: {
        status: number;
        headers: IncomingHttpHeaders
        body: any
    };
};
export const requester = async (requests: SourceTransformed[]): Promise<RequesterResponse[]> => {
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
    const responsesPromises = await Promise.all<Response>(requestsPromises);
    const responses: RequesterResponse[] = [];
    for (let i = 0; i < responsesPromises.length; i++) {
        const response = responsesPromises[i];
        const statusResponse = response.status;
        const headersResponse = parseHeadersFromFetch(response);
        const bodyResponse = (statusResponse != 204) && hasContentTypeJson(headersResponse) ? await responseJson(response) : await response.text();
        responses.push({
            request: requests[i],
            response: {
                status: statusResponse,
                headers: headersResponse,
                body: bodyResponse
            }
        });
        logger('Requests>', requests[i].url, `[${requests[i].method}]`, 'Response: ', statusResponse);
    }
    return responses;
};

export const requesterSerial = async (requests: SourceTransformed[]): Promise<RequesterResponse[]> => {
    if (!requests) return [];
    const responses: RequesterResponse[] = [];
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
        const bodyResponse = (statusResponse != 204) && hasContentTypeJson(headersResponse) ? await responseJson(response) : await response.text();
        responses.push({
            request,
            response: {
                status: statusResponse,
                headers: headersResponse,
                body: bodyResponse
            }
        });
        logger('Requests>', request.url, `[${request.method}]`, 'Response: ', statusResponse);
    }
    return responses;
};

export const buildRequesterService = () => ({requester, requesterSerial});
export type RequesterService = ReturnType<typeof buildRequesterService>;

export default buildRequesterService;
