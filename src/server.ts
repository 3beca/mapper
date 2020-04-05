import fastify from 'fastify';
import packageInfo from '../package.json';
import fastifySwagger from 'fastify-swagger';
import formBody from 'fastify-formbody';
import config from './config';
import {
	ERROR_NOTFOUND,
	ERROR_UNKNOWN,
	encodeErrorFromType
} from './errors';
import logger from './logger';

import { buildAdminRoutes } from './routes/admin/admin';
import { buildMapperRoutes } from './routes/mappers';
import { DependenciesLoader } from './dependencies';

export function buildServer(deps: DependenciesLoader) {
	const app = fastify({
		logger,
		trustProxy: config.trustedProxy
	});

	app.register(fastifySwagger, {
		routePrefix: '/documentation',
		exposeRoute: true,
		swagger: {
			info: {
				title: packageInfo.name,
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
	app.register(buildAdminRoutes(deps), { prefix: '/admin' });
	app.register(buildMapperRoutes(deps), { prefix: '/mappers' });

	app.setNotFoundHandler((request, reply) => {
		reply.code(404).send(
			encodeErrorFromType(
				null,
				ERROR_NOTFOUND.type,
				{
					method: request.raw.method,
					resource: request.raw.url
				}
			)
		);
	});

	app.setErrorHandler((error, request, reply) => {
		if (error.statusCode && error.statusCode < 500) {
			request.log.info(error);
		} else {
			request.log.error(error);
		}
		reply.status(error.statusCode || 500).send(
			encodeErrorFromType(
				null,
				ERROR_UNKNOWN.type,
				{
					status: error.statusCode,
					details: error.message
				}
			)
		);
	});

	return app;
}
