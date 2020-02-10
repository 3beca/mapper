import { encodeError } from '../../utils/error-encoder';
import { checkTemplate } from '../../services/http-engine';
import {
    ERROR_DATABASE,
    ERROR_PARAMS_MISSING,
    findError,
    ERROR_NOTFOUND
} from '../../errors';

const listSourceSchema = {
    tags: ['system'],
    response: {
        200: {
            description: 'List of Sources',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    flows: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                mappingId: { type: 'string' },
                                targetId: { type: 'string' }
                            }
                        }
                    },
                    responseId: { type: 'string' },
                    serial: { type: 'boolean' },
                }
            }
        }
    }
};

const SourceSchema = {
    tags: ['system'],
    response: {
        200: {
            description: 'Object Source',
            type: 'object',
            properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                flows: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            mappingId: { type: 'string' },
                            targetId: { type: 'string' }
                        }
                    }
                },
                responseId: { type: 'string' },
                serial: { type: 'boolean' },
            }
        }
    }
};

export function buildAdminSourcesRoutes(deps) {
    const { sourcesService } = deps(['sourcesService']);

    async function listSources(request, reply) {
        try {
            const sources = await sourcesService.getSources();
            reply.code(200).send(sources);
        }
        catch (error) {
            reply.code(400).send(
                encodeError(
                    null,
                    ERROR_DATABASE.code,
                    ERROR_DATABASE.message,
                    {
                        details: error.message
                    }
                )
            );
        }
    }

    async function findByIdSource(request, reply) {
        const sourceId = request.params.sourceId;
        try {
            const source = await sourcesService.getSourceById(sourceId);
            if (!source) {
                return void reply.code(404).send(encodeError({...ERROR_NOTFOUND, meta: {details: `SourceId ${sourceId} not found in database`}}));
            }
            return void reply.code(200).send(source);
        }
        catch (error) {
            return void reply.code(400).send(
                encodeError(
                    null,
                    ERROR_DATABASE.code,
                    ERROR_DATABASE.message,
                    {
                        details: error.message
                    }
                )
            );
        }
    }

    async function createSource(request, reply) {
        const body = request.body || {};
        let errors = null;
        const missingParams = [
            'name',
        ].filter(param => !body[param]);

        if (missingParams.length > 0) {
            errors = encodeError(errors, ERROR_PARAMS_MISSING.code, ERROR_PARAMS_MISSING.message, {params: missingParams});
        }

        if (errors) {
            return void reply.code(400).send(errors);
        }

        try {
            const source = {
                name: body.name,
                description: body.description
            };
            const inserted = await sourcesService.insertSource(source);
            return void reply.code(200).send(inserted);
        }
        catch (error) {
            const errorFound = findError(error);
            const reportedError = encodeError({...errorFound, meta: { details: error.message }});
            return void reply.code(400).send(reportedError);
        }
    }

    return function(fastify, opts, next) {
        fastify.get('/', { ...opts, ...{ logLevel: 'warn', schema: listSourceSchema }}, listSources);
        fastify.get('/:sourceId', { ...opts, ...{ logLevel: 'warn', schema: SourceSchema }}, findByIdSource);
        fastify.post('/', { ...opts, ...{ logLevel: 'warn', schema: SourceSchema }}, createSource);
        next();
    };
}
