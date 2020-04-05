import {
    ERROR_DATABASE,
    ERROR_PARAMS_MISSING,
    ERROR_NOTFOUND,
    ERROR_INVALID_PARAM_VALUE,
    encodeErrorFromType,
    encodeErrorFromError,
    ErrorResponseList
} from '../../errors';
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import type { ServerResponse } from 'http';
import type { DependenciesLoader } from '../../dependencies';

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
                url: { type: 'string' },
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

export function buildAdminSourcesRoutes(deps: DependenciesLoader) {
    const {
        sourcesService,
        mappingsService,
        targetsService,
        responsesService
    } = deps(['sourcesService', 'mappingsService', 'targetsService', 'responsesService']);

    async function listSources(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
        try {
            const sources = await sourcesService.getSources();
            reply.code(200).send(sources);
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

    async function findByIdSource(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
        const sourceId: string = request.params.sourceId;
        try {
            const source = await sourcesService.getSourceById(sourceId);
            if (!source) {
                return void reply.code(404).send(encodeErrorFromType(null, ERROR_NOTFOUND.type, {details: `SourceId ${sourceId} not found in database`}));
            }
            return void reply.code(200).send(source);
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

    async function createSource(request, reply) {
        const body = request.body;
        let errors: ErrorResponseList = null;
        const missingParams = [
            'name',
        ].filter(param => !body[param]);

        if (missingParams.length > 0) {
            errors = encodeErrorFromType(errors, ERROR_PARAMS_MISSING.type, {params: missingParams});
        }

        if (errors) {
            return void reply.code(400).send(errors);
        }

        try {
            const invalidParams: object[] = [];
            const flows = body.flows;
            if (flows) {
                if (Array.isArray(flows)) {
                    // Check each flow
                    for (const flow of flows) {
                        const targetId = flow.targetId;
                        const target = await targetsService.getTargetById(targetId);
                        if (!target) invalidParams.push({targetId: targetId || null});
                        const mappingId = flow.mappingId;
                        if (mappingId) {
                            const mapping = await mappingsService.getMappingById(mappingId);
                            if (!mapping) invalidParams.push({mappingId});
                        }
                    }
                } else {
                    invalidParams.push({flows});
                }
            }
            const responseId = body.responseId;
            if (responseId) {
                const response = await responsesService.getResponseById(responseId);
                if (!response) invalidParams.push({responseId});
            }
            if (invalidParams.length > 0) {
                errors = encodeErrorFromType(errors, ERROR_INVALID_PARAM_VALUE.type, {params: invalidParams});
                return void reply.code(400).send(errors);
            }
            const source = {
                name: body.name,
                description: body.description,
                flows,
                responseId,
                serial: body.serial || false
            };
            const inserted = await sourcesService.insertSource(source);
            return void reply.code(200).send(inserted);
        }
        catch (error) {
            const reportedError = encodeErrorFromError(null, error, { details: error.message });
            return void reply.code(400).send(reportedError);
        }
    }

    return function(fastify: FastifyInstance, opts: any, next: Function) {
        fastify.get('/', { ...opts, ...{ logLevel: 'warn', schema: listSourceSchema }}, listSources);
        fastify.get('/:sourceId', { ...opts, ...{ logLevel: 'warn', schema: SourceSchema }}, findByIdSource);
        fastify.post('/', { ...opts, ...{ logLevel: 'warn', schema: SourceSchema }}, createSource);
        next();
    };
}
