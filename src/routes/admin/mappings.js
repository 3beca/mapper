import { encodeError } from '../../utils/error-encoder';
import {
    ERROR_DATABASE
} from '../../errors';

const listMappingSchema = {
    tags: ['system'],
    response: {
        200: {
            description: 'List of mappings',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    template: { type: 'string' }
                }
            }
        }
    }
};

export function buildAdminMappingsRoutes(deps) {
    const { mappingsService } = deps(['mappingsService']);

    async function listMappings(request, reply) {
        try {
            const mappings = await mappingsService.getMappings();
            reply.code(200).send(mappings);
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

    return function(fastify, opts, next) {
        fastify.get('/', { ...opts, ...{ logLevel: 'warn', schema: listMappingSchema } }, listMappings);
        next();
    };
};

