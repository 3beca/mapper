import { Liquid } from 'liquidjs';
import { applyProxy } from '../utils/apply-proxy';

const liquidEngine = new Liquid();

const parseTemplate = async (source, template) => {
    if (!template) return undefined;
    return await liquidEngine.parseAndRender(template, source);
};

export const transformSource = async (sourceRequest = {}, template, target) => {
    if (!target || typeof target !== 'object') throw new Error('Error target not found');

    const method = target.method || 'GET';
    const url = await parseTemplate(sourceRequest, target.url);
    try {
        // eslint-disable-next-line no-new
        new URL(url);
    } catch (error) {
        throw new Error('Error parsing url from mapping template: ' + error.message);
    }
    const headersString = await parseTemplate(sourceRequest, target.headers);
    let headers;
    try {
        headers = headersString ? JSON.parse(headersString) : undefined;
    }
    catch (error) {
        throw new Error('Error parsing target headers: ' + error.message);
    }
    if (!template) return {method, url, headers};

    const sourceBody = {
        params: applyProxy(sourceRequest.params || {}, 'null'),
        body: applyProxy(sourceRequest.body || {}, 'null'),
        headers: applyProxy(sourceRequest.headers || {}, 'null')
    };
    const body = await parseTemplate(sourceBody, template);
    if (headers && headers['Content-Type'] === 'application/json') {
        try {
            JSON.parse(body);
        }
        catch (error) {
            throw new Error('Error parsing body from mapping template: ' + error.message);
        }
    }
    return {method, url, body, headers};
};
