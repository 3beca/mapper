jest.mock('pino');
import { buildServer } from '../src/server';
import { createDependencies } from '../src/dependencies';
import {
    ERROR_DATABASE,
    ERROR_NOTFOUND
} from '../src/errors';
import { overridedDeps, EMPTY_OBJECT } from '../tests-utils/dependencies';
import { encodeError } from '../src/utils/error-encoder';
import { buildSourcesService } from '../src/services/sources';
import {
    createFakeSource,
    createFakeFlow,
    createFakeResponse
} from '../tests-utils/fake-entities';

describe('admin', () => {
    let server, deps, dbClient, sourcesCollection, mappingsCollection, targetsCollection, responsesCollection;
    beforeAll(
        async () => {
            deps = await createDependencies({DBNAME: 'test-routes-sources'});
            ({
                dbClient,
                sourcesCollection,
                mappingsCollection,
                targetsCollection,
                responsesCollection
            } = deps(['dbClient', 'sourcesCollection', 'mappingsCollection', 'targetsCollection', 'responsesCollection']));
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
                encodeError(
                    null,
                    ERROR_DATABASE.code,
                    ERROR_DATABASE.message,
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

        it('should return Error 404 when source not found', async () => {
            const sourceId = '123456789098';
            const response = await server.inject({
                method: 'GET',
                url: '/admin/sources/' + sourceId
            });
            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.payload)).toEqual(
                encodeError({...ERROR_NOTFOUND, meta: {details: `SourceId ${sourceId} not found in database`}})
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
                encodeError(
                    null,
                    ERROR_DATABASE.code,
                    ERROR_DATABASE.message,
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
            expect(JSON.parse(response.payload)).toEqual({...expectedSource, _id: sourceId + ''});
        });
    });

    describe('[POST] /sources', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const sourcesService = buildSourcesService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {sourcesService});
            const server = buildServer(overDeps);
            const fakeSource = await createFakeSource(
                sourcesCollection,
                mappingsCollection,
                targetsCollection,
                responsesCollection,
                'It works!!!',
                '{"content-type": "text/plain"}',
                'https://notifier.triveca.ovh/',
                'POST',
                'Just Works!',
                '{"content-type": "text/plain"}',
                '200',
                'MongoFails'
            );
            console.log('Fake Soruce', fakeSource);
            const response = await server.inject({
                method: 'POST',
                url: '/admin/sources',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'source-name',
                    description: 'my first source map',
                    flows: [{mappingId: '123456789098', targetId: '098765432123'}],
                    responseId: '657473829105',
                    serial: false
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeError(
                    null,
                    ERROR_DATABASE.code,
                    ERROR_DATABASE.message,
                    {
                        details: 'sourcesCollection.insertOne is not a function'
                    }
                )
            );
        });
    });
});
