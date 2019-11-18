import { mapper } from '../services/mapper';
import {
    ERROR_MAPPER,
    ERROR_DATABASE,
    ERROR_SOURCE_ID,
    ERROR_RESPONSE_ID,
    ERROR_TRANSFORM_RESPONSE
} from '../errors';
import { encodeError } from '../utils/error-encoder';
import { getId } from '../database';
import { requester, requesterSerial } from '../services/requester';
import { transformResponse } from '../services/http-engine';

const mapperSchema = {
    tags: ['mappers'],
    response: {
        200: {
            description: 'Mapper result ok',
            type: 'object'
        }
    }
};

export const mapperFlow = (
    sourcesCollection,
    mappingsCollection,
    targetsCollection,
    responsesCollection,
) => async (request, reply) => {
    const sourceId = request.params.sourceId;
    const context = {
        method: request.raw.method,
        params: {...request.params, ...request.query},
        body: request.body,
        headers: request.headers
    };
    let idMongo;
    try {
        idMongo = getId(sourceId);
    }
    catch (error) {
        return reply.code(400).headers(
            {
                'content-type': 'application/json'
            }
        ).send(
            encodeError(
                null,
                ERROR_SOURCE_ID.code,
                ERROR_SOURCE_ID.message,
                {
                    sourceId: sourceId,
                    context: context,
                    details: error.message
                }
            )
        );
    }

    let source;
    try {
        source = await sourcesCollection.findOne({_id: idMongo});
    }
    catch (error) {
        return reply.code(400).headers(
            {
                'content-type': 'application/json'
            }
        ).send(
            encodeError(
                null,
                ERROR_DATABASE.code,
                ERROR_DATABASE.message,
                {
                    sourceId: sourceId,
                    context: context,
                    details: error.message
                }
            )
        );
    }

    try {
        const {requests, errors} = await mapper(source, context, mappingsCollection, targetsCollection);
        const responses = !source.serial ? await requester(requests) : await requesterSerial(requests);

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
            responseMapping = await responsesCollection.findOne({_id: getId(source.responseId)});
            if (!responseMapping) throw new Error('Response Mapping not found');
        }
        catch (error) {
            const errorswithmapping = encodeError(errors, ERROR_RESPONSE_ID.code, ERROR_RESPONSE_ID.message, {details: error.message});
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
            return reply.code(response.status).headers(response.headers || {}).send(response.body);
        }
        catch (error) {
            const errorsWithResponsemapping = encodeError(errors, ERROR_TRANSFORM_RESPONSE.code, ERROR_TRANSFORM_RESPONSE.message, {details: error.message});
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
            encodeError(
                null,
                ERROR_MAPPER.code,
                ERROR_MAPPER.message,
                {
                    sourceId: sourceId,
                    context: context,
                    details: error.message
                }
            )
        );
    }
};

export function buildMapperRoutes(
    sourcesCollection,
    mappingsCollection,
    targetsCollection,
    responsesCollection
) {
    return function(fastify, opts, next) {
        //fastify.post('/', { ...opts, ...{ logLevel: 'warn', schema: mapperSchema } }, mapperFlow);
        fastify.route({
            ...opts,
            method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            url: '/:sourceId',
            //schema: mapperSchema,
            handler: mapperFlow(sourcesCollection, mappingsCollection, targetsCollection, responsesCollection)
        });
        next();
    };
}
