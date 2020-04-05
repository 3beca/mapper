jest.mock('pino');
import { buildServer } from '../src/server';
import { createDependencies } from '../src/dependencies';
import {
    ERROR_DATABASE,
    ERROR_NOTFOUND,
    ERROR_PARAMS_MISSING,
    ERROR_HEADER_FORMAT,
    encodeErrorFromType
} from '../src/errors';
import { overridedDeps, EMPTY_OBJECT } from '../tests-utils/dependencies';
import { buildResponsesService } from '../src/services/responses';

describe('admin', () => {
    let server, deps, dbClient, responsesCollection;
    beforeAll(
        async () => {
            deps = await createDependencies({DBNAME: 'test-routes-responses'});
            ({dbClient, responsesCollection} = deps(['dbClient', 'responsesCollection']));
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
        await responsesCollection.deleteMany();
    });

    describe('[GET] /responses', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const responsesService = buildResponsesService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {responsesService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/responses'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'responsesCollection.find is not a function'
                    }
                )
            );
        });

        it('should return an EMPTY list when no responses', async () => {

            const response = await server.inject({
                method: 'GET',
                url: '/admin/responses'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual([]);
        });

        it('should return the list of responses in database', async () => {
            const expectedResponses = [
                {
                    name: 'nameforresponse1',
                    description: '',
                    status: '200',
                    template: 'OK',
                    headers: '{"content-type": "text"}'
                },
                {
                    name: 'nameforresponse2',
                    description: '',
                    status: '200',
                    template: 'OK',
                    headers: '{"content-type": "text"}'
                }
            ];
            const result = await responsesCollection.insertMany(expectedResponses);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/responses'
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(result.ops.map((response) => ({...response, _id: response._id + ''})));
        });
    });

    describe('[GET] /responses/:id', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const responsesService = buildResponsesService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {responsesService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'GET',
                url: '/admin/responses/123456789098'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'responsesCollection.findOne is not a function'
                    }
                )
            );
        });

        it('should return Error 404 when response not found', async () => {
            const responseId = '123456789098';
            const response = await server.inject({
                method: 'GET',
                url: '/admin/responses/' + responseId
            });
            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(null, ERROR_NOTFOUND.type, {details: `ResponseId ${responseId} not found in database`})
            );
        });

        it('should return Error DATABASE when it is null', async () => {
            const responseId = null;
            const response = await server.inject({
                method: 'GET',
                url: '/admin/responses/' + responseId
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

        it('should return the response object with this responseId', async () => {
            const expectedResponse = {
                name: 'nameforresponse1',
                description: '',
                status: '200',
                template: 'OK',
                headers: '{"content-type": "text"}'
            };
            const expectedResponses = [
                expectedResponse,
                {
                    name: 'nameforresponse2',
                    description: '',
                    status: '200',
                    template: 'OK',
                    headers: '{"content-type": "text"}'
                }
            ];
            const result = await responsesCollection.insertMany(expectedResponses);
            const responseId = result.ops[0]._id;
            const response = await server.inject({
                method: 'GET',
                url: '/admin/responses/' + responseId
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual({...expectedResponse, _id: responseId + ''});
        });
    });

    describe('[POST] /responses', () => {

        it('should return 400 Error when mongodb fails', async () => {
            const responsesService = buildResponsesService(EMPTY_OBJECT);
            const overDeps = overridedDeps(deps, {responsesService});
            const server = buildServer(overDeps);

            const response = await server.inject({
                method: 'POST',
                url: '/admin/responses',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'response-name',
                    description: '',
                    status: '200',
                    template: 'OK',
                    headers: '{"content-type": "text"}'
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_DATABASE.type,
                    {
                        details: 'responsesCollection.insertOne is not a function'
                    }
                )
            );
        });

        it('should return 400 Error when missing required params (name or status)', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/admin/responses'
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_PARAMS_MISSING.type,
                    {
                        params: ['name', 'status']
                    }
                )
            );
        });

        it('should return 400 Error when receive invalid header', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/admin/responses',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'response-name',
                    description: '',
                    status: '200',
                    template: 'OK',
                    headers: '"content-type": "text"}'
                }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual(
                encodeErrorFromType(
                    null,
                    ERROR_HEADER_FORMAT.type,
                    {
                        details: 'Error parsing headers from template: Unexpected token : in JSON at position 14, headers: \"content-type\": \"text\"}'
                    }
                )
            );
        });

        it('should return 200 when create a full valid response object', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/admin/responses',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'response-name',
                    description: 'sample description',
                    status: '200',
                    template: '{{respponse.message}}',
                    headers: '{"content-type": "text"}'
                }
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(
                {
                    _id: expect.any(String),
                    description: 'sample description',
                    name: 'response-name',
                    headers: '{"content-type": "text"}',
                    status: '200',
                    template: '{{respponse.message}}'
                }
            );
        });

        it('should return 200 when create a valid response object without headers', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/admin/responses',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'response-name',
                    description: 'sample description',
                    status: '200',
                    template: '{{respponse.message}}'
                }
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(
                {
                    _id: expect.any(String),
                    description: 'sample description',
                    name: 'response-name',
                    status: '200',
                    template: '{{respponse.message}}'
                }
            );
        });

        it('should return 200 when create a valid response object without template', async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/admin/responses',
                headers: {'content-type': 'application/json'},
                payload: {
                    name: 'response-name',
                    description: '',
                    status: '200',
                    headers: '{"content-type": "text"}'
                }
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(
                {
                    _id: expect.any(String),
                    description: '',
                    name: 'response-name',
                    headers: '{"content-type": "text"}',
                    status: '200'
                }
            );
        });
    });
});
