import { checkTemplate } from '../../services/http-engine';
import {
    ERROR_DATABASE,
    ERROR_PARAMS_MISSING,
    ERROR_NOTFOUND,
    encodeErrorFromError,
    encodeErrorFromType,
    ErrorResponseList
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

const MappingSchema = {
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

    async function findMapping(request, reply) {
        const mappingId = request.params.mappingId;
        // if (!mappingId) {
        //     return void reply.code(400).send(encodeError(ERROR_MAPPING_ID));
        // }
        try {
            const mapping = await mappingsService.getMappingById(mappingId);
            if (!mapping) {
                return void reply.code(404).send(encodeErrorFromType(null, ERROR_NOTFOUND.type, {details: `MappingId ${mappingId} not found in database`}));
            }
            return void reply.code(200).send(mapping);
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

    async function createMapping(request, reply) {
        const body = request.body || {};
        let errors: ErrorResponseList = null;
        const missingParams = [
            'name',
            'template'
        ].filter(param => !body[param]);

        if (missingParams.length > 0) {
            errors = encodeErrorFromType(errors, ERROR_PARAMS_MISSING.type, {params: missingParams});
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
            const reportedError = encodeErrorFromError(null, error, { details: error.message });
            return void reply.code(400).send(reportedError);
        }
    }

    return function(fastify, opts, next) {
        fastify.get('/', { ...opts, ...{ logLevel: 'warn', schema: listMappingSchema }}, listMappings);
        fastify.get('/:mappingId', { ...opts, ...{ logLevel: 'warn', schema: MappingSchema }}, findMapping);
        fastify.post('/', { ...opts, ...{ logLevel: 'warn', schema: MappingSchema }}, createMapping);
        next();
    };
}
