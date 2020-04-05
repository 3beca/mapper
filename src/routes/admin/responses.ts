import { checkTemplate, checkHeaders } from '../../services/http-engine';
import {
    ERROR_DATABASE,
    ERROR_PARAMS_MISSING,
    ERROR_NOTFOUND,
    encodeErrorFromType,
    encodeErrorFromError,
    ErrorResponseList
} from '../../errors';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ServerResponse } from 'http';
import type { DependenciesLoader } from '../../dependencies';

const listResponseSchema = {
    tags: ['system'],
    response: {
        200: {
            description: 'List of Responses',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string' },
                    template: { type: 'string' },
                    headers: { type: 'string' }
                }
            }
        }
    }
};

const ResponseSchema = {
    tags: ['system'],
    response: {
        200: {
            description: 'Object Response',
            type: 'object',
            properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                template: { type: 'string' },
                headers: { type: 'string' }
            }
        }
    }
};

export function buildAdminResponsesRoutes(deps: DependenciesLoader) {
    const { responsesService } = deps(['responsesService']);

    async function listResponses(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
        try {
            const responses = await responsesService!.getResponses();
            reply.code(200).send(responses);
        }
        catch (error) {
            reply.code(400).send(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: error.message
                    }
                )
            );
        }
    }

    async function findResponse(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
        const responseId = request.params.responseId;
        try {
            const response = await responsesService!.getResponseById(responseId);
            if (!response) {
                return void reply.code(404).send(encodeErrorFromType(null, ERROR_NOTFOUND.type, {details: `ResponseId ${responseId} not found in database`}));
            }
            return void reply.code(200).send(response);
        }
        catch (error) {
            return void reply.code(400).send(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: error.message
                    }
                )
            );
        }
    }

    async function createResponse(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
        const body = request.body || {};
        let errors: ErrorResponseList = null;
        const missingParams = [
            'name',
            'status'
        ].filter(param => !body[param]);

        if (missingParams.length > 0) {
            errors = encodeErrorFromType(errors, ERROR_PARAMS_MISSING.type, {params: missingParams});
        }

        if (errors) {
            return void reply.code(400).send(errors);
        }

        try {
            const type = body.type;
            await checkTemplate({}, body.template, type === 'json');
            await checkTemplate({}, body.status);
            if (body.headers) await checkHeaders({}, body.headers);
            const response = {
                name: body.name,
                description: body.description,
                status: body.status,
                headers: body.headers,
                template: body.template
            };
            const inserted = await responsesService!.insertResponse(response);
            return void reply.code(200).send(inserted);
        }
        catch (error) {
            const reportedError = encodeErrorFromError(null, error, { details: error.message });
            return void reply.code(400).send(reportedError);
        }
    }

    return function(fastify, opts, next) {
        fastify.get('/', { ...opts, ...{ logLevel: 'warn', schema: listResponseSchema }}, listResponses);
        fastify.get('/:responseId', { ...opts, ...{ logLevel: 'warn', schema: ResponseSchema }}, findResponse);
        fastify.post('/', { ...opts, ...{ logLevel: 'warn', schema: ResponseSchema }}, createResponse);
        next();
    };
}
