jest.mock('pino');
import { buildServer } from '../src/server';
import { encodeError } from '../src/utils/error-encoder';
import {
	ERROR_NOTFOUND
} from '../src/errors';

describe('builServer', () => {
    let server;

    beforeEach(() => {
        server = buildServer();
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
          encodeError(
            null,
            ERROR_NOTFOUND.code,
            ERROR_NOTFOUND.message,
            {
              method: method,
              resource: invalidUrl
            }
          )
        ));
    });

    it('should return 200 for swagger endpoint', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/documentation/static/index.html'
        });
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('text/html; charset=UTF-8');
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
