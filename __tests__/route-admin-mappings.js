jest.mock('pino');
import { buildServer } from '../src/server';
import {
    connect,
    getAndSetupDatabase,
    COLLECTION_MAPPINGS
} from '../src/database';
import config from '../src/config';
import {
    ERROR_DATABASE
} from '../src/errors';
import { encodeError } from '../src/utils/error-encoder';

describe('admin', () => {
    let server, dbClient, db, collection;
    beforeAll(
        async () => {
            dbClient = await connect(config.mongodb.url);
            db = await getAndSetupDatabase(dbClient, 'test-getmapping-byid');
            collection = db.collection(COLLECTION_MAPPINGS);
        }
    );

    afterAll(
        async () => {
            await collection.deleteMany();
            db = null;
            await dbClient.close();
        }
    );
    beforeEach(() => {
        server = buildServer();
    });

    afterEach(async () => {
        await server.close();
    });

    describe.skip('[GET] /mappings', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const server = buildServer({}, {}, {});

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
                        details: 'sourcesCollection.findOne is not a function'
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

        it('should return the list of mapping in the system', async () => {
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
            const result = await collection.insertMany(expectedMappings);
            console.log('Results', result);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/mappings'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(result.ops);
        });
    });
});
