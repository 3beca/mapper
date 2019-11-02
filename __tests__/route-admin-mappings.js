jest.mock('pino');
import { buildServer } from '../src/server';

describe('admin', () => {
    let server;

    beforeEach(() => {
        server = buildServer();
    });

    afterEach(async () => {
        await server.close();
    });

    describe('/mapping', () => {

        it('should return the list of mapping in the system', async () => {
            const response = await server.inject({
                method: 'GET',
                url: '/admin/mappings'
            });
            expect(response.statusCode).toBe(200);
        });
    });
});
