import fastify from 'fastify';
import packageInfo from '../package.json';
import fastifySwagger from 'fastify-swagger';
import formBody from 'fastify-formbody';
import config from './config';
import { encodeError } from './utils/error-encoder';
import {
	ERROR_NOTFOUND,
	ERROR_UNKNOWN
} from './errors';
import logger from './logger';

import { buildAdminRoutes } from './routes/admin/admin.js';
import { buildMapperRoutes } from './routes/mappers';

export function buildServer(
	sourcesService,
    mappingsService,
	targetsService,
	responsesService
) {
	const app = fastify({
		logger,
		trustProxy: config.trustProxy
	});

	app.register(fastifySwagger, {
		routePrefix: '/documentation',
		exposeRoute: true,
		swagger: {
			info: {
				title: packageInfo.title,
				description: packageInfo.description,
				version: packageInfo.version
			},
			externalDocs: {
				url: packageInfo.homepage,
				description: 'Find more info here'
			},
			tags: [
				{ name: 'system', description: 'System related end-points' }
			],
			host: config.externalHttp.host + (config.externalHttp.port ? ':' + config.externalHttp.port : ''),
			schemes: [config.externalHttp.protocol],
			consumes: ['application/json'],
			produces: ['application/json']
		}
	});

	// Form-body pluggin
	app.register(formBody);

	// End points
	app.register(buildAdminRoutes(sourcesService, mappingsService, targetsService, responsesService), { prefix: '/admin' });
	app.register(buildMapperRoutes(sourcesService, mappingsService, targetsService, responsesService), { prefix: '/mappers' });

	app.setNotFoundHandler({
		preValidation: (req, reply, next) => {
			// your code
			next();
		},
		preHandler: (req, reply, next) => {
			// your code
			next();
		}
	}, function(request, reply) {
		// Default not found handler with preValidation and preHandler hooks
		reply.code(404).send(
			encodeError(
				null,
				ERROR_NOTFOUND.code,
				ERROR_NOTFOUND.message,
				{
					method: request.raw.method,
					resource: request.raw.url
				}
			)
		);
	});

	app.setErrorHandler((error, request, reply) => {
		if (error.statusCode < 500) {
			request.log.info(error);
		} else {
			request.log.error(error);
		}
		reply.status(error.statusCode || 500).send(
			encodeError(
				null,
				ERROR_UNKNOWN.code,
				ERROR_UNKNOWN.message,
				{
					status: error.statusCode,
					details: error.message
				}
			)
		);
	});

	return app;
}
