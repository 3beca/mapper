jest.mock('pino');
import { buildServer } from '../src/server';
import { fakeDeps } from '../tests-utils/dependencies';

describe.skip('admin', () => {
    let server;

    beforeEach(() => {
        server = buildServer(fakeDeps);
    });

    afterEach(async () => {
        await server.close();
    });

    describe('check-health', () => {

        it('should return 204', async () => {
            const response = await server.inject({
                method: 'GET',
                url: '/admin/check-health'
            });
            expect(response.statusCode).toBe(204);
        });
    });

    describe('version', () => {

        it('should return 200 with mapper version', async () => {
            const response = await server.inject({
                method: 'GET',
                url: '/admin/version'
            });
            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
            expect(response.payload).toBe(JSON.stringify({ version: '0.0.1' }));
        });
    });
});
