import { checkHeaders } from '../../services/http-engine';
import {
    ERROR_DATABASE,
    ERROR_PARAMS_MISSING,
    ERROR_NOTFOUND,
    ERROR_INVALID_PARAM_VALUE,
    encodeErrorFromType,
    encodeErrorFromError,
    ErrorResponseList
} from '../../errors';
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import type { ServerResponse } from 'http';
import type { DependenciesLoader } from '../../dependencies';

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

export function buildAdminTargetsRoutes(deps: DependenciesLoader) {
    const { targetsService } = deps(['targetsService']);

    async function listTargets(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
        try {
            const targets = await targetsService!.getTargets();
            reply.code(200).send(targets);
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

    async function findTarget(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
        const targetId = request.params.targetId;
        try {
            const target = await targetsService!.getTargetById(targetId);
            if (!target) {
                return void reply.code(404).send(encodeErrorFromType(null, ERROR_NOTFOUND.type, {details: `TargetId ${targetId} not found in database`}));
            }
            return void reply.code(200).send(target);
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

    async function createTarget(request: FastifyRequest, reply: FastifyReply<ServerResponse>) {
        const body = request.body || {};
        let errors: ErrorResponseList = null;
        const missingParams = [
            'name',
            'method',
            'url'
        ].filter(param => !body[param]);

        if (missingParams.length > 0) {
            errors = encodeErrorFromType(errors, ERROR_PARAMS_MISSING.type, {params: missingParams});
        }

        if (errors) {
            return void reply.code(400).send(errors);
        }

        const method = ['GET', 'PUT', 'POST', 'PATCH', 'OPTIONS', 'HEAD'].some((method) => method === body.method);
        if (!method) {
            return void reply.code(400).send(encodeErrorFromType(null, ERROR_INVALID_PARAM_VALUE.type, {params: ['method', body.method]}));
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
            const inserted = await targetsService!.insertTarget(target);
            return void reply.code(200).send(inserted);
        }
        catch (error) {
            const reportedError = encodeErrorFromError(null, error, { details: error.message });
            return void reply.code(400).send(reportedError);
        }
    }

    return function(fastify: FastifyInstance, opts: any, next: Function) {
        fastify.get('/', { ...opts, ...{ logLevel: 'warn', schema: listTargetSchema }}, listTargets);
        fastify.get('/:targetId', { ...opts, ...{ logLevel: 'warn', schema: TargetSchema }}, findTarget);
        fastify.post('/', { ...opts, ...{ logLevel: 'warn', schema: TargetSchema }}, createTarget);
        next();
    };
}
