import { mapper } from '../services/mapper';
import {
    ERROR_MAPPER,
    ERROR_DATABASE,
    ERROR_SOURCE_ID
} from '../errors';
import { encodeError } from '../utils/error-encoder';
import { getId } from '../database';
import { requester } from '../services/requester';

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
    targetsCollection
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
        if (!idMongo) {
            throw new Error('sourceId is null');
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
        console.log('Req', requests);
        const responses = await requester(requests);

        return reply.code(200).send({
            sourceId: sourceId,
            context: context,
            delivered: responses,
            ...errors
        });
    }
    catch (error) {
        console.log('Error', error);
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
    targetsCollection
) {
    return function(fastify, opts, next) {
        //fastify.post('/', { ...opts, ...{ logLevel: 'warn', schema: mapperSchema } }, mapperFlow);
        fastify.route({
            ...opts,
            method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            url: '/:sourceId',
            //schema: mapperSchema,
            handler: mapperFlow(sourcesCollection, mappingsCollection, targetsCollection)
        });
        next();
    };
}
