jest.mock('pino');
import { buildServer } from '../src/server';
import { createDependencies } from '../src/dependencies';
import {
    ERROR_DATABASE,
    ERROR_NOTFOUND
} from '../src/errors';
import { overridedDeps, EMPTY_OBJECT } from '../tests-utils/dependencies';
import { encodeError } from '../src/utils/error-encoder';
import { buildTargetsService } from '../src/services/targets';

describe('admin', () => {
    let server, deps, dbClient, targetsCollection;
    beforeAll(
        async () => {
            deps = await createDependencies({DBNAME: 'test-routes-targets'});
            ({dbClient, targetsCollection} = deps(['dbClient', 'targetsCollection']));
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
        await targetsCollection.deleteMany();
    });

    describe('[GET] /targets', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const targetsService = buildTargetsService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {targetsService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/targets'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeError(
                    null,
                    ERROR_DATABASE.code,
                    ERROR_DATABASE.message,
                    {
                        details: 'targetsCollection.find is not a function'
                    }
                )
            );
        });

        it('should return an EMPTY list when no targets', async () => {

            const response = await server.inject({
                method: 'GET',
                url: '/admin/targets'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual([]);
        });

        it('should return the list of targets in database', async () => {
            const expectedTargets = [
                {
                    name: 'namefortarget1',
                    description: '',
                    method: '',
                    headers: '',
                    url: ''
                },
                {
                    name: 'namefortarget2',
                    description: '',
                    method: '',
                    headers: '',
                    url: ''
                }
            ];
            const result = await targetsCollection.insertMany(expectedTargets);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/targets'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(result.ops.map((target) => ({...target, _id: target._id + ''})));
        });
    });

    describe('[GET] /targets/:id', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const targetsService = buildTargetsService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {targetsService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/targets/123456789098'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeError(
                    null,
                    ERROR_DATABASE.code,
                    ERROR_DATABASE.message,
                    {
                        details: 'targetsCollection.findOne is not a function'
                    }
                )
            );
        });

        it('should return Error 404 when target not found', async () => {
            const targetId = '123456789098';
            const response = await server.inject({
                method: 'GET',
                url: '/admin/targets/' + targetId
            });
            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.payload)).toEqual(
                encodeError({...ERROR_NOTFOUND, meta: {details: `TargetId ${targetId} not found in database`}})
            );
        });

        it('should return Error DATABASE when it is null', async () => {
            const targetId = null;
            const response = await server.inject({
                method: 'GET',
                url: '/admin/targets/' + targetId
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

        it('should return the target object with this targetId', async () => {
            const expectedTarget = {
                name: 'namefortarget1',
                description: '',
                method: '',
                headers: '',
                url: ''
            };
            const expectedTargets = [
                expectedTarget,
                {
                    name: 'namefortarget2',
                    description: '',
                    method: '',
                    headers: '',
                    url: ''
                }
            ];
            const result = await targetsCollection.insertMany(expectedTargets);
            const targetId = result.ops[0]._id;
            const response = await server.inject({
                method: 'GET',
                url: '/admin/targets/' + targetId
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual({...expectedTarget, _id: targetId + ''});
        });
    });

    describe.skip('[POST] /targets', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const targetsService = buildTargetsService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {targetsService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'POST',
                url: '/admin/targets',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'target-name',
                    description: '',
                    method: 'POST',
                    headers: '{"content-type": "application/json"}',
                    url: 'http://notifier.tribeca.ovh/{{params.topic}}'
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeError(
                    null,
                    ERROR_DATABASE.code,
                    ERROR_DATABASE.message,
                    {
                        details: 'targetsCollection.insertOne is not a function'
                    }
                )
            );
        });
    });
});
