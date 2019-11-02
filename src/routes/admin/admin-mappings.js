const listMappingSchema = {
    tags: ['system'],
    response: {
        200: {
            description: 'mapper version',
            type: 'object',
            properties: {
                version: { type: 'string' }
            }
        }
    }
};

export function buildAdminMappingsRoutes() {

    function listMappings(request, reply) {
        reply.code(200).res.end();
    }

    return function(fastify, opts, next) {
        fastify.get('/', { ...opts, ...{ logLevel: 'warn', schema: listMappingSchema } }, listMappings);
        next();
    };
};

