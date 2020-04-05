jest.mock('pino');
import { buildServer } from '../src/server';
import { createDependencies } from '../src/dependencies';
import {
    ERROR_DATABASE,
    ERROR_PARAMS_MISSING,
    ERROR_MAPPING_FORMAT,
    ERROR_NOTFOUND,
    encodeErrorFromType
} from '../src/errors';
import { overridedDeps, EMPTY_OBJECT } from '../tests-utils/dependencies';
import { buildMappingsService } from '../src/services/mappings';

describe('admin', () => {
    let server, deps, dbClient, mappingsCollection;
    beforeAll(
        async () => {
            deps = await createDependencies({DBNAME: 'test-routes-mapping'});
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
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'mappingsCollection.find is not a function'
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

    describe('[GET] /mappings/:id', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const mappingsService = buildMappingsService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {mappingsService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/mappings/123456789098'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'mappingsCollection.findOne is not a function'
                    }
                )
            );
        });

        it('should return Error 404 when mapping not found', async () => {
            const mappingId = '123456789098';
            const response = await server.inject({
                method: 'GET',
                url: '/admin/mappings/' + mappingId
            });
            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(null, ERROR_NOTFOUND.type, {details: `MappingId ${mappingId} not found in database`})
            );
        });

        it('should return Error DATABASE when it is null', async () => {
            const mappingId = null;
            const response = await server.inject({
                method: 'GET',
                url: '/admin/mappings/' + mappingId
            });
            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
                    }
                )
            );
        });

        it('should return the mapping object with this mappingId', async () => {
            const expectedMapping = {
                name: 'nameformapping1',
                description: '',
                template: ''
            };
            const expectedMappings = [
                expectedMapping,
                {
                    name: 'nameformapping2',
                    description: '',
                    template: ''
                }
            ];
            const result = await mappingsCollection.insertMany(expectedMappings);
            const mappingId = result.ops[0]._id;
            const response = await server.inject({
                method: 'GET',
                url: '/admin/mappings/' + mappingId
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual({...expectedMapping, _id: mappingId + ''});
        });
    });

    describe('[POST] /mappings', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const mappingsService = buildMappingsService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {mappingsService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'POST',
                url: '/admin/mappings',
                payload: {name: 'mapping-name', template: '{}', type: 'json'}
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'mappingsCollection.insertOne is not a function'
                    }
                )
            );
        });

        it('should return 400 Error when missing required params (name and template)', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/admin/mappings'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_PARAMS_MISSING.type,
                    {
                        params: ['name', 'template']
                    }
                )
            );
        });

        it('should return 400 Error when type is json but template cannot be parsed', async () => {

            const response = await server.inject({
                method: 'POST',
                url: '/admin/mappings',
                payload: {name: 'mapping-name', template: '{"value": 10', type: 'json'}
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_MAPPING_FORMAT.type,
                    {
                        details: 'Error parsing body from mapping template: Unexpected end of JSON input, body: {\"value\": 10'
                    }
                )
            );
        });

        it('should return 200 when mapping is a valid json', async () => {

            const response = await server.inject({
                method: 'POST',
                url: '/admin/mappings',
                payload: {name: 'mapping-name', template: '{"type": {{params.sensorType}}, "value": {{params.value}}}', type: 'json'}
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(
                {
                    _id: expect.any(String),
                    name: 'mapping-name',
                    template: '{"type": {{params.sensorType}}, "value": {{params.value}}}'
                }
            );
        });

        it('should return 200 when mapping do not have type', async () => {

            const response = await server.inject({
                method: 'POST',
                url: '/admin/mappings',
                payload: {name: 'mapping-name', template: 'type={{params.sensorType}}&value={{params.value}}'}
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(
                {
                    _id: expect.any(String),
                    name: 'mapping-name',
                    template: 'type={{params.sensorType}}&value={{params.value}}'
                }
            );
        });
    });
});
