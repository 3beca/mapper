import {
    connect,
    getAndSetupDatabase,
    COLLECTION_MAPPINGS
} from '../src/database';
import config from '../src/config';
import {
    getMappings
} from '../src/services/mappings';

describe(
    'getMappings should',
    () => {
        let dbClient, db, collection;
        beforeAll(
            async () => {
                dbClient = await connect(config.mongodb.url);
                db = await getAndSetupDatabase(dbClient, 'test-getmappings');
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

        it(
            'retrun an empty array when no mappings',
            async () => {
                const mappings = await getMappings(collection);
                expect(mappings).toEqual([]);
            }
        );

        it(
            'retrun an array with all mappings',
            async () => {
                const expectedMappings = [
                    {
                        name: 'uniquenameformapping1',
                        transformation: {}
                    },
                    {
                        name: 'uniquenameformapping2',
                        transformation: {}
                    }
                ];
                await collection.insertMany(expectedMappings);

                const mappings = await getMappings(collection);

                expect(mappings).toEqual(expectedMappings);
            }
        );
    }
);
