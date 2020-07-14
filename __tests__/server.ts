jest.mock('pino');
import { buildServer } from '../src/server';
import { fakeDeps } from '../tests-utils/dependencies';
import {
  ERROR_NOTFOUND,
  ERROR_UNKNOWN,
  ErrorWithStatusCode,
  encodeErrorFromType
} from '../src/errors';

describe('builServer', () => {
    let server;

    beforeEach(() => {
        server = buildServer(fakeDeps());
    });

    afterEach(async () => {
        await server.close();
    });

    it('should return 404 for no existing endpoint', async () => {
      const method = 'GET';
      const invalidUrl = '/not-existing-route';
      const response = await server.inject({
          method,
          url: invalidUrl
        });
        expect(response.statusCode).toBe(404);
        expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
        expect(response.payload).toBe(JSON.stringify(
            encodeErrorFromType(
            null,
            ERROR_NOTFOUND.type,
            {
              method: method,
              resource: invalidUrl
            }
          )
        ));
    });

    it('should return 415 when send an invalid header', async () => {
      const context = {
          params: {id: 25},
          body: {name: 'Juanjo', temperature: 25.5},
          headers: { timestamp: '123456789', 'X-APPID': 'tribeca', 'content-type': 'invalid/headers'}
      };


      const response = await server.inject({
          method: 'OPTIONS',
          url: '/mappers/123456789098',
          query: context.params,
          payload: context.body,
          headers: context.headers
      });

      expect(response.statusCode).toBe(415);
      expect(JSON.parse(response.payload)).toEqual(
        encodeErrorFromType(
              null,
              ERROR_UNKNOWN.type,
              {
                  status: 415,
                  details: 'Unsupported Media Type: invalid/headers'
              }
          )
      );
    });

    it('should return 200 for swagger endpoint', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/documentation/static/index.html'
        });
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('text/html; charset=UTF-8');
    });

    it('should capture unhandled 500 errors', async () => {
        server.register(
            async function(fastify, opts, next) {
                fastify.get('/', opts, async () => {
                    const error: ErrorWithStatusCode = new Error('Error 500');
                    error.statusCode = 500;
                    throw error;
                });
                next();
            }, { prefix: '/error' }
        );

        const response = await server.inject({
            method: 'GET',
            url: '/error'
        });

        expect(response.statusCode).toBe(500);
        expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    });

    it('should capture unhandled unknown errors', async () => {
        server.register(
            async function(fastify, opts, next) {
                fastify.get('/', opts, async () => {
                    throw new Error('Error Unknown');
                });
                next();
            }, { prefix: '/error' }
        );

        const response = await server.inject({
            method: 'GET',
            url: '/error'
        });

        expect(response.statusCode).toBe(500);
        expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    });


    it('should return 200 for swagger json endpoint', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/documentation/json'
        });
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    });
});
