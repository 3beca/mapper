import packageInfo from '../../package.json';
import {buildAdminMappingsRoutes} from './admin/admin-mappings';

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
) => (request, reply) => {
    reply.code(200).res.end();
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
            url: '/:params',
            schema: mapperSchema,
            handler: mapperFlow(sourcesCollection, mappingsCollection, targetsCollection)
        });
        next();
    };
}
