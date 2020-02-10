import { encodeError } from '../../utils/error-encoder';
import { checkHeaders } from '../../services/http-engine';
import {
    ERROR_DATABASE,
    ERROR_PARAMS_MISSING,
    findError,
    ERROR_NOTFOUND,
    ERROR_INVALID_PARAM_VALUE
} from '../../errors';

const listTargetSchema = {
    tags: ['system'],
    response: {
        200: {
            description: 'List of targets',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    method: { type: 'string' },
                    headers: { type: 'string' },
                    url: { type: 'string' }
                }
            }
        }
    }
};

const TargetSchema = {
    tags: ['system'],
    response: {
        200: {
            description: 'Object Target',
            type: 'object',
            properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                method: { type: 'string' },
                headers: { type: 'string' },
                url: { type: 'string' }
            }
        }
    }
};

export function buildAdminTargetsRoutes(deps) {
    const { targetsService } = deps(['targetsService']);

    async function listTargets(request, reply) {
        try {
            const targets = await targetsService.getTargets();
            reply.code(200).send(targets);
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

    async function findTarget(request, reply) {
        const targetId = request.params.targetId;
        try {
            const target = await targetsService.getTargetById(targetId);
            if (!target) {
                return void reply.code(404).send(encodeError({...ERROR_NOTFOUND, meta: {details: `TargetId ${targetId} not found in database`}}));
            }
            return void reply.code(200).send(target);
        }
        catch (error) {
            return void reply.code(400).send(
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

    async function createTarget(request, reply) {
        const body = request.body || {};
        let errors = null;
        const missingParams = [
            'name',
            'method',
            'url'
        ].filter(param => !body[param]);

        if (missingParams.length > 0) {
            errors = encodeError(errors, ERROR_PARAMS_MISSING.code, ERROR_PARAMS_MISSING.message, {params: missingParams});
        }

        if (errors) {
            return void reply.code(400).send(errors);
        }

        const method = ['GET', 'PUT', 'POST', 'PATCH', 'OPTIONS', 'HEAD'].some((method) => method === body.method);
        if (!method) {
            return void reply.code(400).send(encodeError(null, ERROR_INVALID_PARAM_VALUE.code, ERROR_INVALID_PARAM_VALUE.message, {params: ['method', body.method]}));
        }

        try {
            if (body.headers) await checkHeaders({}, body.headers);
            const target = {
                name: body.name,
                description: body.description,
                method: body.method,
                headers: body.headers,
                url: body.url
            };
            const inserted = await targetsService.insertTarget(target);
            return void reply.code(200).send(inserted);
        }
        catch (error) {
            const errorFound = findError(error);
            const reportedError = encodeError({...errorFound, meta: { details: error.message }});
            return void reply.code(400).send(reportedError);
        }
    }

    return function(fastify, opts, next) {
        fastify.get('/', { ...opts, ...{ logLevel: 'warn', schema: listTargetSchema }}, listTargets);
        fastify.get('/:targetId', { ...opts, ...{ logLevel: 'warn', schema: TargetSchema }}, findTarget);
        fastify.post('/', { ...opts, ...{ logLevel: 'warn', schema: TargetSchema }}, createTarget);
        next();
    };
}
