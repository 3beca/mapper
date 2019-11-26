import { createDependencies } from '../src/dependencies';
import { typeOf } from '../src/utils/error-encoder';
import { ERROR_DATABASE } from '../src/errors';
import { EMPTY_OBJECT } from '../tests-utils/dependencies';
import { buildMappingsService } from '../src/services/mappings';

describe(
    'getMappings should',
    () => {
        let dbClient, collection, service;
        beforeAll(
            async () => {
                const deps = await createDependencies({DBNAME: 'test-mapping-service-all'});
                ({
                    dbClient,
                    mappingsCollection: collection,
                    mappingsService: service
                } = deps(['dbClient', 'mappingsCollection', 'mappingsService']));
            }
        );

        afterEach(
            async () => {
                await collection.deleteMany();
            }
        );

        afterAll(
            async () => {
                await dbClient.close();
            }
        );

        it(
            'return an empty array when no mappings',
            async () => {
                const mappings = await service.getMappings();
                expect(mappings).toEqual([]);
            }
        );

        it(
            'return an Error array when database fails',
            async () => {
                expect.assertions(1);
                const mappingsService = buildMappingsService(EMPTY_OBJECT);

                try {
                    await mappingsService.getMappings();
                }
                catch (error) {
                    expect(typeOf(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return an array with all mappings',
            async () => {
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
                await collection.insertMany(expectedMappings);

                const mappings = await service.getMappings();

                expect(mappings).toEqual(expectedMappings);
            }
        );
    }
);

describe(
    'getMappingById should',
    () => {
        let dbClient, collection, service;
        beforeAll(
            async () => {
                const deps = await createDependencies({DBNAME: 'test-mapping-service-byId'});
                ({
                    dbClient,
                    mappingsCollection: collection,
                    mappingsService: service
                } = deps(['dbClient', 'mappingsCollection', 'mappingsService']));
            }
        );

        afterEach(
            async () => {
                await collection.deleteMany();
            }
        );

        afterAll(
            async () => {
                await dbClient.close();
            }
        );

        it(
            'return null when undefined mapping id',
            async () => {
                const mappingId = undefined;
                const mapping = await service.getMappingById(mappingId);
                expect(mapping).toEqual(null);
            }
        );

        it(
            'return Error when invalid mapping id',
            async () => {
                expect.assertions(1);
                const mappingId = 'invalidmappingid';
                try {
                    const mapping = await service.getMappingById(mappingId);
                }
                catch (error) {
                    expect(typeOf(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return null when mapping not found',
            async () => {
                const mappingId = '123456789098';
                const mapping = await service.getMappingById(mappingId);
                expect(mapping).toEqual(null);
            }
        );

        it(
            'return Error when database fails',
            async () => {
                expect.assertions(1);
                const mappingId = '123456789098';
                const mappingsService = buildMappingsService(EMPTY_OBJECT);

                try {
                    await mappingsService.getMappingById(mappingId);
                }
                catch (error) {
                    expect(typeOf(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return the mapping from the id',
            async () => {
                const expectedMapping = {
                        name: 'nameformapping1',
                        description: '',
                        template: ''
                    };
                const { insertedId } = await collection.insertOne(expectedMapping);

                const mappings = await service.getMappingById(insertedId);

                expect(mappings).toEqual({...expectedMapping, _id: insertedId});
            }
        );
    }
);
