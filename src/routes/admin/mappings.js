import { encodeError } from '../../utils/error-encoder';
import { checkTemplate } from '../../services/http-engine';
import {
    ERROR_DATABASE,
    ERROR_PARAMS_MISSING,
    findError
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

const createMappingSchema = {
    tags: ['system'],
    response: {
        200: {
            description: 'List of mappings',
            type: 'object',
            properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                template: { type: 'string' }
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

    async function createMapping(request, reply) {
        const body = request.body || {};
        let errors = null;
        const missingParams = [
            'name',
            'template'
        ].filter(param => !body[param]);

        if (missingParams.length > 0) {
            errors = encodeError(errors, ERROR_PARAMS_MISSING.code, ERROR_PARAMS_MISSING.message, {params: missingParams});
        }

        if (errors) {
            return void reply.code(400).send(errors);
        }

        try {
            // Check if json and validate template
            const type = body.type;
            await checkTemplate({}, body.template, type === 'json');
            const mapping = {
                name: body.name,
                description: body.description,
                template: body.template
            };
            const inserted = await mappingsService.insertMapping(mapping);
            return void reply.code(200).send(inserted);
        }
        catch (error) {
            const errorFound = findError(error);
            const reportedError = encodeError({...errorFound, meta: { details: error.message }});
            return void reply.code(400).send(reportedError);
        }
    }

    return function(fastify, opts, next) {
        fastify.get('/', { ...opts, ...{ logLevel: 'warn', schema: listMappingSchema }}, listMappings);
        fastify.post('/', { ...opts, ...{ logLevel: 'warn', schema: createMappingSchema }}, createMapping);
        next();
    };
}
