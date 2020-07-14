import {
    ERROR_MAPPER,
    ERROR_DATABASE,
    ERROR_SOURCE_ID,
    ERROR_RESPONSE_ID,
    ERROR_TRANSFORM_RESPONSE,
    encodeErrorFromType
} from '../errors';
import { transformResponse, ContextRequest } from '../services/http-engine';
import { logger } from '../utils/logger';
import type { DependenciesLoader } from '../dependencies';
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import type { Server } from 'http';

export const mapperFlow = (deps: DependenciesLoader) => {
    const {sourcesService, mapperService, responsesService, requesterService} = deps(['sourcesService', 'mapperService', 'responsesService', 'requesterService']);

    return async (request: FastifyRequest<{ Params: { sourceId: string }, Querystring: { [key:string]: string } }>, reply: FastifyReply<Server>) => {

        const sourceId: string = request.params.sourceId;
        const context: ContextRequest = {
            method: request.raw.method,
            params: {...request.params, ...request.query},
            body: request.body,
            headers: request.headers
        };
        if (!sourceId || sourceId.length != 24) {
            return reply.code(400).headers(
                {
                    'content-type': 'application/json'
                }
            ).send(
                encodeErrorFromType(
                    null,
                    ERROR_SOURCE_ID.type,
                    {
                        sourceId: sourceId,
                        context: context,
                        details: `Invalid sourceId ${sourceId}`
                    }
                )
            );
        }
        let source;
        try {
            source = await sourcesService.getSourceById(sourceId);
        }
        catch (error) {
            return reply.code(400).headers(
                {
                    'content-type': 'application/json'
                }
            ).send(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        sourceId: sourceId,
                        context: context,
                        details: error.message
                    }
                )
            );
        }

        try {
            logger('Mappers>', source.name, `[${request.raw.method}]`);
            const {requests, errors} = await mapperService!(source, context);
            const responses = !source.serial ? await requesterService.requester(requests) : await requesterService.requesterSerial(requests);

            if (!source.responseId) {
                return reply.code(200).send({
                    sourceId: sourceId,
                    context: context,
                    delivered: responses,
                    ...errors
                });
            }

            let responseMapping;
            try {
                responseMapping = await responsesService.getResponseById(source.responseId);
                if (!responseMapping) {
                    return reply.code(200).send({
                        sourceId: sourceId,
                        responseId: source.responseId,
                        context: context,
                        delivered: responses
                    });
                }
            }
            catch (error) {
                const errorswithmapping = encodeErrorFromType(errors, ERROR_RESPONSE_ID.type, {details: error.message});
                return reply.code(200).send({
                    sourceId: sourceId,
                    responseId: source.responseId,
                    context: context,
                    delivered: responses,
                    ...errorswithmapping
                });
            }

            try {
                const responseContext = {
                    ...context,
                    responses,
                    ...errors
                };
                const response = await transformResponse(responseContext, responseMapping);
                logger('Response>', responseMapping.name, `[${response.status}]`);
                return reply.code(response.status).headers(response.headers || {}).send(response.body);
            }
            catch (error) {
                const errorsWithResponsemapping = encodeErrorFromType(errors, ERROR_TRANSFORM_RESPONSE.type, {details: error.message});
                return reply.code(200).send({
                    sourceId: sourceId,
                    responseId: source.responseId,
                    context: context,
                    delivered: responses,
                    ...errorsWithResponsemapping
                });
            }
        }
        catch (error) {
            return reply.code(400).headers(
                {
                    'content-type': 'application/json'
                }
            ).send(
                encodeErrorFromType(
                    null,
                    ERROR_MAPPER.type,
                    {
                        sourceId: sourceId,
                        context: context,
                        details: error.message
                    }
                )
            );
        }
    };
};

export function buildMapperRoutes(deps: DependenciesLoader) {
    return function(fastify: FastifyInstance, opts: any, next: Function) {
        fastify.route({
            ...opts,
            method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            url: '/:sourceId',
            //schema: mapperSchema,
            handler: mapperFlow(deps)
        });
        next();
    };
}
