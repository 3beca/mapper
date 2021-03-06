import packageInfo from '../../../package.json';
import {buildAdminMappingsRoutes} from './mappings';
import {buildAdminTargetsRoutes} from './targets';
import {buildAdminResponsesRoutes} from './responses';
import {buildAdminSourcesRoutes} from './sources';

const checkHealthSchema = {
    tags: ['system'],
    response: {
        204: {
            description: 'Health check successfull',
            type: 'object'
        }
    }
};

const versionSchema = {
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

export function buildAdminRoutes(deps) {

    function checkHealth(request, reply) {
        reply.code(204).res.end();
    }

    async function version() {
        return { version: packageInfo.version };
    }

    return function(fastify, opts, next) {
        fastify.get('/check-health', { ...opts, ...{ logLevel: 'warn', schema: checkHealthSchema } }, checkHealth);
        fastify.get('/version', { ...opts, ...{ logLevel: 'warn', schema: versionSchema } }, version);
        fastify.register(buildAdminMappingsRoutes(deps), { prefix: '/mappings' });
        fastify.register(buildAdminTargetsRoutes(deps), { prefix: '/targets' });
        fastify.register(buildAdminResponsesRoutes(deps), { prefix: '/responses' });
        fastify.register(buildAdminSourcesRoutes(deps), { prefix: '/sources' });
        next();
    };
}
