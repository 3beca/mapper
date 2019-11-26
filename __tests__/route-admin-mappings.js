jest.mock('pino');
import { buildServer } from '../src/server';
import { createDependencies } from '../src/dependencies';
import { ERROR_DATABASE } from '../src/errors';
import { overridedDeps, EMPTY_OBJECT } from '../tests-utils/dependencies';
import { encodeError } from '../src/utils/error-encoder';
import { buildMappingsService } from '../src/services/mappings';

describe.skip('admin', () => {
    let server, deps, dbClient, mappingsCollection;
    beforeAll(
        async () => {
            deps = await createDependencies({DBNAME: 'test-getmapping-byid'});
            ({dbClient, mappingsCollection} = deps(['dbClient', 'mappingsCollection']));
        }
    );

    afterAll(
        async () => {
            await dbClient.close();
        }
    );
    beforeEach(async () => {
        server = buildServer(deps);
    });

    afterEach(async () => {
        await server.close();
        await mappingsCollection.deleteMany();
    });

    describe('[GET] /mappings', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const mappingsService = buildMappingsService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {mappingsService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/mappings'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeError(
                    null,
                    ERROR_DATABASE.code,
                    ERROR_DATABASE.message,
                    {
                        details: 'mappingCollection.find is not a function'
                    }
                )
            );
        });

        it('should return an EMPTY list of mapping when no mappings', async () => {

            const response = await server.inject({
                method: 'GET',
                url: '/admin/mappings'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual([]);
        });

        it('should return the list of mapping in database', async () => {
            const expectedMappings = [
                {
                    name: 'nameformapping1',
                    description: '',
                    template: ''
                },
                {
                    name: 'nameformapping2',
                    description: '',
                    template: ''
                }
            ];
            const result = await mappingsCollection.insertMany(expectedMappings);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/mappings'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(result.ops.map((mapping) => ({...mapping, _id: mapping._id + ''})));
        });
    });
});
