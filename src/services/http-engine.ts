import { URL } from 'url';
import { createLiquidEngine } from '../utils/liquid-engine';
import { applyProxy } from '../utils/apply-proxy';
import { hasContentTypeJson } from '../utils/parse-headers';
import {
    ERROR_MAPPING_FORMAT,
    ERROR_TRANSFORM_SOURCE,
    ERROR_TRANSFORM_RESPONSE,
    ERROR_HEADER_FORMAT,
    throwError
} from '../errors';
import type { Target } from './targets';
import type { DefaultHeaders } from 'fastify';
import type { Response } from './responses';

export type SourceTransformed = {
    method: string;
    url: string;
    headers?: DefaultHeaders;
    body?: string|Buffer;
};
export type ResponseTransformed = {
    status: number;
    headers?: DefaultHeaders;
    body?: string|object;
};
export type ContextRequest = {
    method?: string,
    params?: object,
    body?: any,
    headers?: DefaultHeaders,
    responses?: any[],
};

const liquidEngine = createLiquidEngine();

const parseTemplate = async (context: ContextRequest, template: string|undefined) => {
    if (!template) return undefined;
    return await liquidEngine.parseAndRender(template, context);
};

export const checkTemplate = async (context: ContextRequest, template: string, isJsonObject = false): Promise<string|undefined> => {
    const proxedContext: ContextRequest = {
        params: applyProxy(context.params || {}, 'null'),
        body: applyProxy(context.body || {}, 'null'),
        headers: applyProxy(context.headers || {}, 'null')
    };
    const body = await parseTemplate(proxedContext, template);
    if (isJsonObject) {
        try {
            JSON.parse(body as string);
        }
        catch (error) {
            throwError(ERROR_MAPPING_FORMAT.type, 'Error parsing body from mapping template: ' + error.message + ', body: ' + body);
        }
    }
    return body;
};

export const checkHeaders = async (context: ContextRequest, template: string): Promise<string|undefined> => {
    const proxedContext: ContextRequest = {
        params: applyProxy(context.params || {}, 'null'),
        body: applyProxy(context.body || {}, 'null'),
        headers: applyProxy(context.headers || {}, 'null')
    };
    const headers = await parseTemplate(proxedContext, template);
    // if (!headers) return undefined;
    try {
        JSON.parse(headers as string);
    }
    catch (error) {
        throwError(ERROR_HEADER_FORMAT.type, 'Error parsing headers from template: ' + error.message + ', headers: ' + headers);
    }
    return headers;
};

export const transformSource = async (context: ContextRequest = {}, template: string|undefined|null, target: Target|null|undefined): Promise<SourceTransformed> => {
    if (!target || typeof target !== 'object') throw new Error('Error target not found');

    const method = target.method || 'GET';
    const url = await parseTemplate(context, target.url);
    if (!url) {
        return throwError(ERROR_TRANSFORM_SOURCE.type, 'Error parsing url from mapping template: undefined');
    }
    try {
        // eslint-disable-next-line no-new
        new URL(url);
    } catch (error) {
        return throwError(ERROR_TRANSFORM_SOURCE.type, 'Error parsing url from mapping template: ' + error.message);
    }

    const headersString = await parseTemplate(context, target.headers);
    let headers: DefaultHeaders;
    try {
        headers = headersString ? JSON.parse(headersString) : undefined;
    }
    catch (error) {
        return throwError(ERROR_TRANSFORM_SOURCE.type, 'Error parsing target headers: ' + error.message);
    }
    if (!template) return {method, url, headers};
    const body = await checkTemplate(context, template, hasContentTypeJson(headers));
    if (target.encoding === 'binary' && typeof body === 'string') {
        return {method, url, body: Buffer.from(body), headers};
    }
    return {method, url, body, headers};
};

export const transformResponse = async (context: ContextRequest = {}, response: Response): Promise<ResponseTransformed> => {
    if (!response || typeof response !== 'object') throw new Error('Error invalid response');

    const statusText = await parseTemplate(context, response.status);
    let status: number;
    try {
        status = Number(statusText);
        if (status !== status || status < 100 || status >= 600) throwError(ERROR_TRANSFORM_RESPONSE.type, `status ${statusText} cannot be transformed to a valid status`);
    } catch (error) {
        return throwError(ERROR_TRANSFORM_RESPONSE.type, 'Error parsing status from mapping template: ' + error.message);
    }

    const headersString = await parseTemplate(context, response.headers);
    let headers: DefaultHeaders;
    try {
        headers = headersString ? JSON.parse(headersString) : undefined;
    }
    catch (error) {
        return throwError(ERROR_TRANSFORM_RESPONSE.type, 'Error parsing response headers: ' + error.message);
    }
    if (!response.template) return {status, headers};

    const proxedContext: ContextRequest = {
        params: applyProxy(context.params || {}, 'null'),
        body: applyProxy(context.body || {}, 'null'),
        headers: applyProxy(context.headers || {}, 'null'),
        responses: applyProxy(context.responses || [], 'null')
    };
    const bodyString = await parseTemplate(proxedContext, response.template);
    if (hasContentTypeJson(headers)) {
        try {
            const body = JSON.parse(bodyString || '');
            return {status, headers, body};
        }
        catch (error) {
            throwError(ERROR_TRANSFORM_RESPONSE.type, 'Error parsing body from response template: ' + error.message + ', body: ' + bodyString);
        }
    }
    return {status, headers, body: bodyString};
};

export const buildHttpEngineService = () => ({
    transformSource,
    transformResponse
});
export type HttpEngineService = ReturnType<typeof buildHttpEngineService>;

export default buildHttpEngineService;
