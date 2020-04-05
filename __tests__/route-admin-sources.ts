jest.mock('pino');
import { buildServer } from '../src/server';
import { createDependencies } from '../src/dependencies';
import {
    ERROR_DATABASE,
    ERROR_NOTFOUND,
    ERROR_PARAMS_MISSING,
    ERROR_INVALID_PARAM_VALUE,
    ERROR_UNKNOWN,
    encodeErrorFromType
} from '../src/errors';
import { overridedDeps, EMPTY_OBJECT } from '../tests-utils/dependencies';
import { buildSourcesService } from '../src/services/sources';
import {
    createFakeFlow,
    createFakeResponse,
    createFakeTarget,
    createFakeMapping
} from '../tests-utils/fake-entities';

describe('admin', () => {
    let server, deps, dbClient, sourcesCollection, mappingsCollection, targetsCollection, responsesCollection, sourcesService;
    beforeAll(
        async () => {
            deps = await createDependencies({DBNAME: 'test-routes-sources'});
            ({
                dbClient,
                sourcesCollection,
                mappingsCollection,
                targetsCollection,
                responsesCollection,
                sourcesService
            } = deps(['dbClient', 'sourcesCollection', 'mappingsCollection', 'targetsCollection', 'responsesCollection', 'sourcesService']));
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
        await sourcesCollection.deleteMany();
        await mappingsCollection.deleteMany();
        await targetsCollection.deleteMany();
        await responsesCollection.deleteMany();
    });

    describe('[GET] /sources', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const sourcesService = buildSourcesService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {sourcesService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/sources'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'sourcesCollection.find is not a function'
                    }
                )
            );
        });

        it('should return an EMPTY list when no sources', async () => {

            const response = await server.inject({
                method: 'GET',
                url: '/admin/sources'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual([]);
        });

        it('should return the list of sources in database', async () => {
            const expectedSources = [
                {
                    name: 'source name',
                    description: '',
                    flows: [
                        {mappingId: '123456789098', targetId: '123456789098'},
                        {mappingId: '123456789099', targetId: '123456989098'},
                    ],
                    responseId: '765432345676',
                    serial: true
                },
                {
                    name: 'source name 2',
                    description: '',
                    flows: [
                        {mappingId: '123416789098', targetId: '123451789098'},
                        {mappingId: '123456781099', targetId: '123451989098'},
                    ],
                    responseId: '765434345676',
                    serial: true
                },
            ];
            const result = await sourcesCollection.insertMany(expectedSources);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/sources'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(result.ops.map((source) => ({...source, _id: source._id + ''})));
        });
    });

    describe('[GET] /sources/:id', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const sourcesService = buildSourcesService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {sourcesService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/sources/123456789098'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'sourcesCollection.findOne is not a function'
                    }
                )
            );
        });

        it('should return Error 404 when source not found', async () => {
            const sourceId = '123456789098';
            const response = await server.inject({
                method: 'GET',
                url: '/admin/sources/' + sourceId
            });
            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(null, ERROR_NOTFOUND.type, {details: `SourceId ${sourceId} not found in database`})
            );
        });

        it('should return Error DATABASE when it is null', async () => {
            const sourceId = null;
            const response = await server.inject({
                method: 'GET',
                url: '/admin/sources/' + sourceId
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

        it('should return the source object with this sourceId', async () => {
            const expectedSource = {
                name: 'source name',
                description: '',
                flows: [
                    {mappingId: '123456789098', targetId: '123456789098'},
                    {mappingId: '123456789099', targetId: '123456989098'},
                ],
                responseId: '765432345676',
                serial: true
            };
            const expectedSources = [
                expectedSource,
                {
                    name: 'source name 2',
                    description: '',
                    flows: [
                        {mappingId: '123456289098', targetId: '123450789098'},
                        {mappingId: '123457789099', targetId: '123456389098'},
                    ],
                    responseId: '765432145676',
                    serial: true
                }
            ];
            const result = await sourcesCollection.insertMany(expectedSources);
            const sourceId = result.ops[0]._id;
            const response = await server.inject({
                method: 'GET',
                url: '/admin/sources/' + sourceId
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual({...expectedSource, _id: sourceId + '', url: expect.stringContaining('/mappers/' + sourceId)});
        });
    });

    describe('[POST] /sources', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const sourcesService = buildSourcesService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {sourcesService});
            const server = buildServer(overDeps);

            const flow = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works!',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'MongoFails'
            );
            const responseId = await createFakeResponse(
                responsesCollection,
                'Response body template',
                '{"content-type": "text/plain"}',
                '200',
                'MongoFails'
            );

            const response = await server.inject({
                method: 'POST',
                url: '/admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'source-name',
                    description: 'my first source map',
                    flows: [flow],
                    responseId: responseId,
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'sourcesCollection.insertOne is not a function'
                    }
                )
            );
        });

        it('should return Error missing params when body not present', async () => {
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: undefined
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_UNKNOWN.type,
                    {
                        details: expect.any(String),
                        status: 400
                    }
                )
            );
        });

        it('should return Error missing params when name not present', async () => {
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    description: 'my first source map',
                    flows: [{mappingId: '123456789098', targetId: '098765432123'}],
                    responseId: '657473829105',
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_PARAMS_MISSING.type,
                    {
                        params: ['name']
                    }
                )
            );
        });

        it('should return a new source without flow nor response', async () => {
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'MyFirstSingleSource',
                    description: 'my first source map without flow nor response',
                    serial: true
                }
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(
                {
                    _id: expect.any(String),
                    name: 'MyFirstSingleSource',
                    description: 'my first source map without flow nor response',
                    serial: true,
                    url: expect.stringContaining('/mappers/')
                }
            );
        });

        it('should return error when the flow is not saved in database', async () => {
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'InvalidSourceCosFlowsAndResponse',
                    description: 'my first source map',
                    flows: [{targetId: '098765432123', mappingId: '123456789098'}],
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{targetId: '098765432123'}, {mappingId: '123456789098'}]
                    }
                )
            );
        });

        it('should return error when the flow nor responseId is not saved in database', async () => {
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'InvalidSourceCosFlowsAndResponse',
                    description: 'my first source map',
                    flows: [{targetId: '098765432123', mappingId: '123456789098'}],
                    responseId: '657473829105',
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{targetId: '098765432123'}, {mappingId: '123456789098'}, {responseId: '657473829105'}]
                    }
                )
            );
        });

        it('should return error when the flow nor responseId is not saved in database but responseId is valid', async () => {
            const responseId = await createFakeResponse(
                responsesCollection,
                'Response body template',
                '{"content-type": "text/plain"}',
                '200',
                'ValidResponse'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'InvalidSourceCosFlowsAndResponse',
                    description: 'my first source map',
                    flows: [{targetId: '098765432123', mappingId: '123456789098'}],
                    responseId,
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{targetId: '098765432123'}, {mappingId: '123456789098'}]
                    }
                )
            );
        });

        it('should return error when the mappingId in flow is valid but targetId is not found', async () => {
            const flow = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works!',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'MongoFails'
            );
            const responseId = await createFakeResponse(
                responsesCollection,
                'Response body template',
                '{"content-type": "text/plain"}',
                '200',
                'ValidResponse'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'InvalidSourceCosFlowsAndResponse',
                    description: 'my first source map',
                    flows: [{mappingId: flow.mappingId, targetId: '098765432123'}],
                    responseId,
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{targetId: '098765432123'}]
                    }
                )
            );
        });

        it('should return error when the responseId in flow is valid but targetId is not found', async () => {
            const flow = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works!',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'MongoFails'
            );
            const responseId = await createFakeResponse(
                responsesCollection,
                'Response body template',
                '{"content-type": "text/plain"}',
                '200',
                'ValidResponse'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'InvalidSourceCosFlowsAndResponse',
                    description: 'my first source map',
                    flows: [{mappingId: '123456789098', targetId: flow.targetId}],
                    responseId,
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{mappingId: '123456789098'}]
                    }
                )
            );
        });

        it('should return error when the responseId in flow is not found', async () => {
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'InvalidSourceCosFlowsAndResponse',
                    description: 'my first source map',
                    flows: [{mappingId: '123456789098'}],
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{targetId: null}, {mappingId: '123456789098'}]
                    }
                )
            );
        });

        it('should return error when flows in not an array', async () => {
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'InvalidSourceCosFlowsAndResponse',
                    description: 'my first source map',
                    flows: 'notanarray',
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{flows: 'notanarray'}]
                    }
                )
            );
        });

        it('should return error when the targetId in flow is not found', async () => {
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'InvalidSourceCosFlowsAndResponse',
                    description: 'my first source map',
                    flows: [{targetId: '123456789098'}],
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{targetId: '123456789098'}]
                    }
                )
            );
        });

        it('should return error when response is not found', async () => {
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'InvalidSourceCosFlowsAndResponse',
                    description: 'my first source map',
                    responseId: '123456789098',
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{responseId: '123456789098'}]
                    }
                )
            );
        });

        it('should return a new source only with response', async () => {
            const responseId = await createFakeResponse(
                responsesCollection,
                'Response body template',
                '{"content-type": "text/plain"}',
                '200',
                'ValidResponse'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'avalidsourceonlywithresponse',
                    description: 'my first source map',
                    responseId: responseId,
                    serial: true
                }
            });

            const sourceCreated = JSON.parse(response.payload);
            expect(response.statusCode).toBe(200);
            expect(sourceCreated).toEqual({
                _id: expect.any(String),
                name: 'avalidsourceonlywithresponse',
                description: 'my first source map',
                responseId,
                serial: true, url: expect.stringContaining('/mappers/')
            });

            const sourceInDB = await sourcesService.getSourceById(sourceCreated._id);
            expect(sourceInDB).not.toBe(null);
            expect(sourceCreated).toEqual({
                _id: sourceInDB._id + '',
                name: sourceInDB.name,
                description: sourceInDB.description,
                responseId: sourceInDB.responseId,
                serial: true,
                url: expect.stringContaining('/mappers/' + sourceInDB._id)
            });
        });

        it('should return a new source with one full flow and with response', async () => {
            const flow = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works!',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'FullFlow'
            );
            const responseId = await createFakeResponse(
                responsesCollection,
                'Response body template',
                '{"content-type": "text/plain"}',
                '200',
                'ValidResponse'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'avalidsourcefulloptions',
                    description: 'my first source map',
                    flows: [flow],
                    responseId: responseId,
                    serial: false
                }
            });

            const sourceCreated = JSON.parse(response.payload);
            expect(response.statusCode).toBe(200);
            expect(sourceCreated).toEqual({
                _id: expect.any(String),
                name: 'avalidsourcefulloptions',
                description: 'my first source map',
                flows: [flow],
                responseId,
                serial: false,
                url: expect.stringContaining('/mappers/' + sourceCreated._id)
            });

            const sourceInDB = await sourcesService.getSourceById(sourceCreated._id);
            expect(sourceInDB).not.toBe(null);
            expect(sourceCreated).toEqual({
                _id: sourceInDB._id + '',
                name: sourceInDB.name,
                description: sourceInDB.description,
                flows: sourceInDB.flows,
                responseId: sourceInDB.responseId,
                serial: false,
                url: expect.stringContaining('/mappers/' + sourceInDB._id)
            });
        });

        it('should return a new source with two full flow and with response', async () => {
            const flow1 = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works!',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'FullFlow'
            );
            const flow2 = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works! 2',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'FullFlow 2'
            );
            const responseId = await createFakeResponse(
                responsesCollection,
                'Response body template',
                '{"content-type": "text/plain"}',
                '200',
                'ValidResponse'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'avalidsourcefulloptions',
                    description: 'my first source map',
                    flows: [flow1, flow2],
                    responseId: responseId,
                    serial: true
                }
            });

            const sourceCreated = JSON.parse(response.payload);
            expect(response.statusCode).toBe(200);
            expect(sourceCreated).toEqual({
                _id: expect.any(String),
                name: 'avalidsourcefulloptions',
                description: 'my first source map',
                flows: [flow1, flow2],
                responseId,
                serial: true,
                url: expect.stringContaining('/mappers/' + sourceCreated._id)
            });

            const sourceInDB = await sourcesService.getSourceById(sourceCreated._id);
            expect(sourceInDB).not.toBe(null);
            expect(sourceCreated).toEqual({
                _id: sourceInDB._id + '',
                name: sourceInDB.name,
                description: sourceInDB.description,
                flows: sourceInDB.flows,
                responseId: sourceInDB.responseId,
                serial: true,
                url: expect.stringContaining('/mappers/' + sourceInDB._id)
            });
        });

        it('should return a new source with full flow and without response', async () => {
            const flow = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works!',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'FullFlow'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'avalidsourcefulloptions',
                    description: 'my first source map',
                    flows: [flow],
                    serial: false
                }
            });

            const sourceCreated = JSON.parse(response.payload);
            expect(response.statusCode).toBe(200);
            expect(sourceCreated).toEqual({
                _id: expect.any(String),
                name: 'avalidsourcefulloptions',
                description: 'my first source map',
                flows: [flow],
                serial: false,
                url: expect.stringContaining('/mappers/' + sourceCreated._id)
            });

            const sourceInDB = await sourcesService.getSourceById(sourceCreated._id);
            expect(sourceInDB).not.toBe(null);
            expect(sourceCreated).toEqual({
                _id: sourceInDB._id + '',
                name: sourceInDB.name,
                description: sourceInDB.description,
                flows: sourceInDB.flows,
                responseId: sourceInDB.responseId,
                serial: false,
                url: expect.stringContaining('/mappers/' + sourceInDB._id)
            });
        });

        it('should return a new source with half flow (targetId) and without response', async () => {
            const targetId = await createFakeTarget(
                targetsCollection,
                '{"X-APP-ID": "tribeca"}',
                'https://notifier.triveca.ovh/',
                'GET',
                'onlyTargetId'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'avalidsourcefulloptions',
                    description: 'my first source map',
                    flows: [{targetId}],
                    serial: true
                }
            });

            const sourceCreated = JSON.parse(response.payload);
            expect(response.statusCode).toBe(200);
            expect(sourceCreated).toEqual({
                _id: expect.any(String),
                name: 'avalidsourcefulloptions',
                description: 'my first source map',
                flows: [{targetId}],
                serial: true,
                url: expect.stringContaining('/mappers/' + sourceCreated._id)
            });

            const sourceInDB = await sourcesService.getSourceById(sourceCreated._id);
            expect(sourceInDB).not.toBe(null);
            expect(sourceCreated).toEqual({
                _id: sourceCreated._id + '',
                name: sourceCreated.name,
                description: sourceCreated.description,
                flows: sourceCreated.flows,
                responseId: sourceCreated.responseId,
                serial: true,
                url: expect.stringContaining('/mappers/' + sourceCreated._id)
            });
        });

        it('should return an error when flow without target', async () => {
            const mappingId = await createFakeMapping(
                mappingsCollection,
                'Simple text template',
                'validmapping'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'avalidsourcefulloptions',
                    description: 'my first source map',
                    flows: [{mappingId}],
                    serial: false
                }
            });

            const sourceCreated = JSON.parse(response.payload);
            expect(response.statusCode).toBe(400);
            expect(sourceCreated).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{targetId: null}]
                    }
                )
            );
        });

        it('should return an ERROR INVALID PARAMS when two full flow and with response but one flow missing targetId', async () => {
            const flow1 = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works!',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'FullFlow'
            );
            const flow2 = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works! 2',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'FullFlow 2'
            );
            const responseId = await createFakeResponse(
                responsesCollection,
                'Response body template',
                '{"content-type": "text/plain"}',
                '200',
                'ValidResponse'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'avalidsourcefulloptions',
                    description: 'my first source map',
                    flows: [flow1, {targetId: '123456789876', mappingId: flow2.mappingId}],
                    responseId: responseId,
                    serial: false
                }
            });

            const sourceCreated = JSON.parse(response.payload);
            expect(response.statusCode).toBe(400);
            expect(sourceCreated).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{targetId: '123456789876'}]
                    }
                )
            );

            const sourceInDB = await sourcesService.getSourceById(sourceCreated._id);
            expect(sourceInDB).toBe(null);
        });

        it('should return an ERROR INVALID PARAMS when two full flow and with response but flows missing targetId', async () => {
            const flow1 = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works!',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'FullFlow'
            );
            const flow2 = await createFakeFlow(
                mappingsCollection,
                targetsCollection,
                'Mapping Template Just Works! 2',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'FullFlow 2'
            );
            const responseId = await createFakeResponse(
                responsesCollection,
                'Response body template',
                '{"content-type": "text/plain"}',
                '200',
                'ValidResponse'
            );
            const response = await server.inject({
                method: 'POST',
                url: 'admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'avalidsourcefulloptions',
                    description: 'my first source map',
                    flows: [{targetId: '987525364759', mappingId: flow1.mappingId}, {targetId: '123456789876', mappingId: flow2.mappingId}],
                    responseId: responseId,
                    serial: false
                }
            });

            const sourceCreated = JSON.parse(response.payload);
            expect(response.statusCode).toBe(400);
            expect(sourceCreated).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_INVALID_PARAM_VALUE.type,
                    {
                        params: [{targetId: '987525364759'}, {targetId: '123456789876'}]
                    }
                )
            );

            const sourceInDB = await sourcesService.getSourceById(sourceCreated._id);
            expect(sourceInDB).toBe(null);
        });
    });
});
