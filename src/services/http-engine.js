import { Liquid } from 'liquidjs';
import { applyProxy } from '../utils/apply-proxy';
import { hasContentTypeJson } from '../utils/parse-headers';
import { throwError } from '../utils/error-encoder';
import { ERROR_MAPPING_FORMAT, ERROR_TRANSFORM_SOURCE, ERROR_TRANSFORM_RESPONSE } from '../errors';

const liquidEngine = new Liquid();

const parseTemplate = async (source, template) => {
    if (!template) return undefined;
    return await liquidEngine.parseAndRender(template, source);
};

export const checkTemplate = async (context, template, isJsonObject) => {
    const sourceBody = {
        params: applyProxy(context.params || {}, 'null'),
        body: applyProxy(context.body || {}, 'null'),
        headers: applyProxy(context.headers || {}, 'null')
    };
    const body = await parseTemplate(sourceBody, template);
    if (isJsonObject) {
        try {
            JSON.parse(body);
        }
        catch (error) {
            throwError(ERROR_MAPPING_FORMAT.type, 'Error parsing body from mapping template: ' + error.message + ', body: ' + body);
        }
    }
    return body;
};

export const transformSource = async (context = {}, template, target) => {
    if (!target || typeof target !== 'object') throw new Error('Error target not found');

    const method = target.method || 'GET';
    const url = await parseTemplate(context, target.url);
    try {
        // eslint-disable-next-line no-new
        new URL(url);
    } catch (error) {
        throwError(ERROR_TRANSFORM_SOURCE.type, 'Error parsing url from mapping template: ' + error.message);
    }

    const headersString = await parseTemplate(context, target.headers);
    let headers;
    try {
        headers = headersString ? JSON.parse(headersString) : undefined;
    }
    catch (error) {
        throwError(ERROR_TRANSFORM_SOURCE.type, 'Error parsing target headers: ' + error.message);
    }
    if (!template) return {method, url, headers};
    const body = await checkTemplate(context, template, hasContentTypeJson(headers));
    return {method, url, body, headers};
};

export const transformResponse = async (context = {}, response) => {
    if (!response || typeof response !== 'object') throw new Error('Error invalid response');

    const statusText = await parseTemplate(context, response.status);
    let status;
    try {
        status = Number(statusText);
        if (status !== status || status < 100 || status >= 600) throwError(ERROR_TRANSFORM_RESPONSE.type, `status ${statusText} cannot be transformed to a valid status`);
    } catch (error) {
        throwError(ERROR_TRANSFORM_RESPONSE.type, 'Error parsing status from mapping template: ' + error.message);
    }

    const headersString = await parseTemplate(context, response.headers);
    let headers;
    try {
        headers = headersString ? JSON.parse(headersString) : undefined;
    }
    catch (error) {
        throwError(ERROR_TRANSFORM_RESPONSE.type, 'Error parsing response headers: ' + error.message);
    }
    if (!response.template) return {status, headers};

    const sourceBody = {
        params: applyProxy(context.params || {}, 'null'),
        body: applyProxy(context.body || {}, 'null'),
        headers: applyProxy(context.headers || {}, 'null'),
        responses: applyProxy(context.responses || [], 'null')
    };
    const bodyString = await parseTemplate(sourceBody, response.template);
    if (hasContentTypeJson(headers)) {
        try {
            const body = JSON.parse(bodyString);
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

export default buildHttpEngineService;
