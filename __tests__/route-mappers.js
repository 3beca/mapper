jest.mock('pino');
import { buildServer } from '../src/server';
import { createDependencies } from '../src/dependencies';
import { overridedDeps } from '../tests-utils/dependencies';
import { buildResponsesService } from '../src/services/responses';
import { buildSourcesService } from '../src/services/sources';
import {
    ERROR_MAPPER,
    ERROR_DATABASE,
    ERROR_SOURCE_ID
} from '../src/errors';
import { encodeError } from '../src/utils/error-encoder';
import {
    createPostRequest,
    createGetRequest,
    createDeleteRequest
} from '../tests-utils/mock-requsts';
import {
    EMPTY_OBJECT
} from '../tests-utils/dependencies';
import {
    createFakeFlow,
    createFakeResponse
} from '../tests-utils/fake-entities';

describe('Route mapper', () => {
    let deps, dbClient, mappingsCollection, sourcesCollection, targetsCollection, responsesCollection, server;
    beforeAll(
        async () => {
            deps = await createDependencies({DBNAME: 'test-route-mapper'});
            ({
                dbClient,
                mappingsCollection,
                sourcesCollection,
                targetsCollection,
                responsesCollection
            } = deps([
                'dbClient',
                'mappingsCollection',
                'sourcesCollection',
                'targetsCollection',
                'responsesCollection'
            ]));
        }
    );

    afterAll(
        async () => {
            await server.close();
            await dbClient.close();
        }
    );

    beforeEach(
        async () => {
            await mappingsCollection.deleteMany();
            await sourcesCollection.deleteMany();
            await targetsCollection.deleteMany();
            await responsesCollection.deleteMany();
            server = buildServer(deps);
        }
    );

    it('should return ERROR SOURCE_ID when sourceid not sent', async () => {
        const context = {
            params: {id: 25},
            body: {name: 'Juanjo', temperature: 25.5},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };

        const response = await server.inject({
            method: 'POST',
            url: '/mappers/',
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.payload)).toEqual(
            encodeError(
                null,
                ERROR_SOURCE_ID.code,
                ERROR_SOURCE_ID.message,
                {
                    sourceId: '',
                    context: {
                        method: 'POST',
                        params: { sourceId: '', id: '25'},
                        body: { name: 'Juanjo', temperature: 25.5 },
                        headers: {
                            timestamp: 123456789,
                            'x-appid': 'tribeca',
                            'content-type': 'application/json',
                            'user-agent': 'lightMyRequest',
                            'host': 'localhost:80',
                            'content-length': '36'
                        }
                    },
                    details: 'Invalid sourceId '
                }
            )
        );
    });

    it('should return ERROR SOURCE_ID when sourceid is not valid', async () => {
        const sourceId = 'sourceidnotvalid';
        const context = {
            params: {id: 25},
            body: {name: 'Juanjo', temperature: 25.5},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };

        const response = await server.inject({
            method: 'POST',
            url: '/mappers/' + sourceId,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.payload)).toEqual(
            encodeError(
                null,
                ERROR_SOURCE_ID.code,
                ERROR_SOURCE_ID.message,
                {
                    sourceId: 'sourceidnotvalid',
                    context: {
                        method: 'POST',
                        params: { sourceId: 'sourceidnotvalid', id: '25'},
                        body: { name: 'Juanjo', temperature: 25.5 },
                        headers: {
                            timestamp: 123456789,
                            'x-appid': 'tribeca',
                            'content-type': 'application/json',
                            'user-agent': 'lightMyRequest',
                            'host': 'localhost:80',
                            'content-length': '36'
                        }
                    },
                    details: 'Invalid sourceId sourceidnotvalid'
                }
            )
        );
    });

    it('should return ERROR SOURCE_ID when sourceid is null', async () => {
        const sourceId = null;
        const context = {
            params: {id: 25},
            body: {name: 'Juanjo', temperature: 25.5},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };

        const response = await server.inject({
            method: 'POST',
            url: '/mappers/' + sourceId,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.payload)).toEqual(
            encodeError(
                null,
                ERROR_SOURCE_ID.code,
                ERROR_SOURCE_ID.message,
                {
                    sourceId: 'null',
                    context: {
                        method: 'POST',
                        params: { sourceId: 'null', id: '25'},
                        body: { name: 'Juanjo', temperature: 25.5 },
                        headers: {
                            timestamp: 123456789,
                            'x-appid': 'tribeca',
                            'content-type': 'application/json',
                            'user-agent': 'lightMyRequest',
                            'host': 'localhost:80',
                            'content-length': '36'
                        }
                    },
                    details: 'Invalid sourceId null'
                }
            )
        );
    });

    it('should return 400 Error when mongodb fails', async () => {
        const sourceId = '5dd9ad23c6ba9f08af08b097';
        const context = {
            params: {id: 25},
            body: {name: 'Juanjo', temperature: 25.5},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };
        const sourcesService = buildSourcesService(EMPTY_OBJECT);
        const overDeps = overridedDeps(deps, {sourcesService});
        const server = buildServer(overDeps);

        const response = await server.inject({
            method: 'POST',
            url: '/mappers/' + sourceId,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.payload)).toEqual(
            encodeError(
                null,
                ERROR_DATABASE.code,
                ERROR_DATABASE.message,
                {
                    sourceId,
                    context: {
                        method: 'POST',
                        params: { sourceId, id: '25'},
                        body: { name: 'Juanjo', temperature: 25.5 },
                        headers: {
                            timestamp: 123456789,
                            'x-appid': 'tribeca',
                            'content-type': 'application/json',
                            'user-agent': 'lightMyRequest',
                            'host': 'localhost:80',
                            'content-length': '36'
                        }
                    },
                    details: 'sourcesCollection.findOne is not a function'
                }
            )
        );
    });

    it('should return 400 when source is not completed', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: {id: 25},
            body: {name: 'Juanjo', temperature: 25.5},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName
        });

        const response = await server.inject({
            method: 'POST',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.payload)).toEqual(
            encodeError(
                null,
                ERROR_MAPPER.code,
                ERROR_MAPPER.message,
                {
                    sourceId: sourceInserted + '',
                    context: {
                        method: 'POST',
                        params: { sourceId: sourceInserted + '', id: '25'},
                        body: { name: 'Juanjo', temperature: 25.5 },
                        headers: {
                            timestamp: 123456789,
                            'x-appid': 'tribeca',
                            'content-type': 'application/json',
                            'user-agent': 'lightMyRequest',
                            'host': 'localhost:80',
                            'content-length': '36'
                        }
                    },
                    details: 'source.flows is not iterable'
                }
            )
        );
    });

    it('should return 200 when receive a GET, POST, PUT, PATCH or DELETE request and fire a POST request', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: {id: 25},
            body: {name: 'Juanjo', temperature: 28.5},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };
        const flow1 = await createFakeFlow(
            mappingsCollection,
            targetsCollection,
            '{"senderName": "{{body.name}}", "temperature": {{body.temperature}}}',
            '{"content-type" : "application/json"}',
            'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
        );
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [
                flow1,
                {mappingId: '123456789158', targetId: '098765432165'}
            ]
        });

        for (const method of [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
            createPostRequest(
                'https://notifier.triveca.ovh',
                '/25?date=123456789',
                method === 'GET' ? {senderName: 'null', temperature: null} : {senderName: context.body.name, temperature: context.body.temperature},
                {'content-type': 'application/json'},
                200,
                '<html><body><div>Hola</div></body></html>',
                {'content-type': 'text/plain'}
            );

            const response = await server.inject({
                method: method,
                url: '/mappers/' + sourceInserted,
                query: context.params,
                payload: context.body,
                headers: context.headers
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual({
                sourceId: sourceInserted + '',
                context: {
                  method: method,
                  params: { sourceId: sourceInserted + '', id: '25' },
                  body: method === 'GET' ? null : { name: 'Juanjo', temperature: 28.5 },
                  headers: {
                    timestamp: 123456789,
                    'x-appid': 'tribeca',
                    'content-type': 'application/json',
                    'user-agent': 'lightMyRequest',
                    host: 'localhost:80',
                    'content-length': '36'
                  }
                },
                delivered: [
                  {
                    request: {
                        method: 'POST',
                        url: 'https://notifier.triveca.ovh/25?date=123456789',
                        body: method === 'GET' ? '{"senderName": "null", "temperature": null}' : '{"senderName": "Juanjo", "temperature": 28.5}',
                        headers: {
                            'content-type': 'application/json'
                        }
                    },
                    response: {
                        headers: {'content-type': 'text/plain'},
                        body: '<html><body><div>Hola</div></body></html>',
                        status: 200
                    }
                  }
                ],
                errors: [
                    {
                        code: 1001,
                        message: 'Error transforming source',
                        meta: {
                            details: 'Error target not found',
                            mapping: '123456789158',
                            source: sourceInserted + '',
                            target: '098765432165'
                        }
                    }
                ]
            });
        }
    });

    it('should return 200 when receive a POST with url encoded params request and fire a GET request', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: {id: 25},
            body: 'value=anyvalue&value2=othervalue',
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/x-www-form-urlencoded'}
        };
        const target = {
            name: 'targettest1',
            method: 'GET',
            url: 'https://notifier.triveca.ovh/?v1={{body.value}}&v2={{body.value2}}'
        };
        const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [
                {targetId: targetInserted}
            ]
        });

        const req = createGetRequest(
            'https://notifier.triveca.ovh',
            '/?v1=anyvalue&v2=othervalue',
            undefined,
            200,
            {code: 200, message: 'request saved'},
            {'content-type': 'application/json'}
        );

        const response = await server.inject({
            method: 'POST',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.payload)).toEqual({
            sourceId: sourceInserted + '',
            context: {
                method: 'POST',
                params: { id: '25', sourceId: sourceInserted + ''},
                body: {
                    value: 'anyvalue',
                    value2: 'othervalue'
                },
                headers: {
                    timestamp: 123456789,
                    'x-appid': 'tribeca',
                    'content-type': 'application/x-www-form-urlencoded',
                    'user-agent': 'lightMyRequest',
                    host: 'localhost:80',
                    'content-length': '32'
                }
            },
            delivered: [
                {
                    request: {
                        method: 'GET',
                        url: 'https://notifier.triveca.ovh/?v1=anyvalue&v2=othervalue'
                    },
                    response: {
                        body: {
                            code: 200,
                            message: 'request saved'
                        },
                        headers: {
                            'content-type': 'application/json'
                        },
                        status: 200
                    }
                }
            ]
        });
    });

    it('should return 200 when receive a GET with params request and fire a POST request with url encoded params', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: {id: 25, value: 'anyvalue', value2: 'othervalue'},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
        };
        const target = {
            name: 'targettest1',
            method: 'POST',
            url: 'https://notifier.triveca.ovh/',
            headers: '{"content-type": "application/x-www-form-urlencoded"}'
        };
        const mapping = {
            name: 'mappingtest1',
            template: 'v1={{params.value}}&v2={{params.value2}}'
        };
        const { insertedId: mappingInserted} = await mappingsCollection.insertOne(mapping);
        const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [
                {mappingId: mappingInserted, targetId: targetInserted}
            ]
        });

        const req = createPostRequest(
            'https://notifier.triveca.ovh',
            '/',
            'v1=anyvalue&v2=othervalue',
            {'content-type': 'application/x-www-form-urlencoded'},
            200,
            {code: 200, message: 'request saved'},
            {'content-type': 'application/json'}
        );

        const response = await server.inject({
            method: 'GET',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.payload)).toEqual({
            sourceId: sourceInserted + '',
            context: {
                method: 'GET',
                params: { id: '25', sourceId: sourceInserted + '', value: 'anyvalue', value2: 'othervalue'},
                body: null,
                headers: {
                    timestamp: 123456789,
                    'x-appid': 'tribeca',
                    'user-agent': 'lightMyRequest',
                    host: 'localhost:80'
                }
            },
            delivered: [
                {
                    request: {
                        method: 'POST',
                        url: 'https://notifier.triveca.ovh/',
                        body: 'v1=anyvalue&v2=othervalue',
                        headers: {
                            'content-type': 'application/x-www-form-urlencoded'
                        }
                    },
                    response: {
                        body: {
                            code: 200,
                            message: 'request saved'
                        },
                        headers: {
                            'content-type': 'application/json'
                        },
                        status: 200
                    }
                }
            ]
        });
    });

    it('should return 200 with an error when receive a GET request and responses collections fails', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: {
                id: 25,
                timestamp: 12345678
            },
            headers: {'X-APPID': 'tribeca', 'Content-Type': 'application/json'}
        };
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [],
            responseId: '123456789098'
        });

        const responsesService = buildResponsesService(EMPTY_OBJECT);
        const overDeps = overridedDeps(deps, {responsesService});
        const server = buildServer(overDeps);

        const response = await server.inject({
            method: 'GET',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers).toEqual(expect.objectContaining({
            connection: 'keep-alive',
            'content-length': expect.any(String),
            'content-type': 'application/json; charset=utf-8',
            date: expect.any(String),
        }));
        expect(JSON.parse(response.payload)).toEqual(expect.objectContaining({
            errors: [{code: 1004, message: 'Invalid responseId', meta: {details: 'responsesCollection.findOne is not a function'}}]
        }));
    });

    it('should return 200 with an error when receive a GET request and responseId is not valid', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: {
                id: 25,
                timestamp: 12345678
            },
            headers: {'X-APPID': 'tribeca', 'Content-Type': 'application/json'}
        };
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [],
            responseId: 'invalidresponseid'
        });
        const responsesService = buildResponsesService(EMPTY_OBJECT);
        const overDeps = overridedDeps(deps, {responsesService});
        const server = buildServer(overDeps);

        const response = await server.inject({
            method: 'GET',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers).toEqual(expect.objectContaining({
            connection: 'keep-alive',
            'content-type': 'application/json; charset=utf-8',
            date: expect.any(String),
        }));
        expect(JSON.parse(response.payload)).toEqual(expect.objectContaining({
            errors: [
                {code: 1004, message: 'Invalid responseId', meta: {details: 'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'}}
            ]
        }));
    });

    it('should return 200 with an error when receive a GET request but responseId is not found', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: {
                id: 25,
                timestamp: 12345678
            },
            headers: {'X-APPID': 'tribeca', 'Content-Type': 'application/json'}
        };
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [],
            responseId: '123456789876'
        });

        const response = await server.inject({
            method: 'GET',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers).toEqual(expect.objectContaining({
            connection: 'keep-alive',
            'content-type': 'application/json; charset=utf-8',
            date: expect.any(String),
        }));
        expect(JSON.parse(response.payload)).toEqual(expect.objectContaining({
            errors: [{code: 1004, message: 'Invalid responseId', meta: {details: 'Response Mapping not found'}}]
        }));
    });

    it('should return ERROR TRANSFORM RESPONSE when response mapping has no status', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            body: {
                id: 25,
                timestamp: 12345678
            },
            headers: {'X-APPID': 'tribeca', 'Content-Type': 'application/json'}
        };
        const responseMapping = {
            name: 'targettest1',
            template: '{id:{{params.id}}, timestamp: {{params.timestamp}}}',
            headers: '{"content-type": "application/json"}'
        };
        const { insertedId: responseInserted} = await responsesCollection.insertOne(responseMapping);
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [],
            responseId: responseInserted
        });

        const response = await server.inject({
            method: 'POST',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers).toEqual(expect.objectContaining({
            connection: 'keep-alive',
            'content-type': 'application/json; charset=utf-8',
            date: expect.any(String),
        }));
        expect(JSON.parse(response.payload)).toEqual(expect.objectContaining({
            errors: [
                {
                    code: 1005,
                    message: 'Error transforming response',
                    meta: {details: 'Error parsing status from mapping template: status undefined cannot be transformed to a valid status'}
                }
            ]
        }));
    });

    it('should return 200 with custom body', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            body: {
                id: 25,
                timestamp: 12345678
            },
            headers: {'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };
        const responseMapping = {
            name: 'targettest1',
            status: '200',
            template: '{"id":{{body.id}}, "timestamp": {{body.timestamp}}}',
            headers: '{"content-type": "application/json"}'
        };
        const { insertedId: responseInserted} = await responsesCollection.insertOne(responseMapping);
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [],
            responseId: responseInserted
        });

        const response = await server.inject({
            method: 'POST',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers).toEqual(expect.objectContaining({
            connection: 'keep-alive',
            'content-type': 'application/json; charset=utf-8',
            date: expect.any(String),
        }));
        expect(JSON.parse(response.payload)).toEqual({id: 25, timestamp: 12345678});
    });

    it('should return 204 with custom NO body and NO headers', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            body: {
                id: 25,
                timestamp: 12345678
            },
            headers: {'X-APPID': 'tribeca', 'Content-Type': 'application/json'}
        };
        const responseMapping = {
            name: 'targettest1',
            status: '204'
        };
        const { insertedId: responseInserted} = await responsesCollection.insertOne(responseMapping);
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [],
            responseId: responseInserted
        });

        const response = await server.inject({
            method: 'GET',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(204);
        expect(response.headers).toEqual(expect.objectContaining({
            connection: 'keep-alive',
            date: expect.any(String),
        }));
        expect(response.payload).toBeFalsy();
    });

    it('should return 400 Error with custom NO body and NO headers', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            body: {
                id: 25,
                timestamp: 12345678
            },
            headers: {'X-APPID': 'tribeca', 'Content-Type': 'application/json'}
        };
        const responseMapping = {
            name: 'targettest1',
            status: '400',
            headers: '{"x-custom-error": "400.25"}'
        };
        const { insertedId: responseInserted} = await responsesCollection.insertOne(responseMapping);
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [],
            responseId: responseInserted
        });

        const response = await server.inject({
            method: 'GET',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(400);
        expect(response.headers).toEqual(expect.objectContaining({
            connection: 'keep-alive',
            'x-custom-error': '400.25',
            date: expect.any(String),
        }));
        expect(response.payload).toBeFalsy();
    });

    it('should return 200 with custom body response when receive a PUT and fire two POST in parallel', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: { sensorId: 'sensorrpi3juanjo' },
            body: {
                type: 'temperature',
                value: 24.4,
                timestamp: 123456789
            },
            headers: {'X-APPID': 'tribeca', 'Content-Type': 'application/json'}
        };
        const flow1 = await createFakeFlow(
            mappingsCollection,
            targetsCollection,
            '{"id": "{{params.sensorId}}", "sensorType": "{{body.type}}", "sensorValue": {{body.value}}}',
            '{"Content-Type": "application/json", "X-APPID":"{{headers[\'x-appid\']}}"}',
            'https://notifier.triveca.ovh/{{params.sensorId}}?topic={{body.type}}',
            'POST'
        );
        const flow2 = await createFakeFlow(
            mappingsCollection,
            targetsCollection,
            'id={{params.sensorId}}&sensorType={{body.type}}&sensorValue={{body.value}}',
            '{"Content-Type": "application/x-www-form-urlencoded", "X-APPID":"{{headers[\'X-APPID\']}}"}',
            'https://notifier.triveca.ovh/{{params.sensorId}}?topic={{body.type}}',
            'POST'
        );
        const responseMapping = await createFakeResponse(
            responsesCollection,
            '{"id":"{{params.sensorId}}", "responses": ["{{responses[0].response.body.message}}", "{{responses[1].response.body.message}}"]}',
            '{"content-type": "application/json"}'
        );

        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [flow1, flow2],
            responseId: responseMapping
        });

        const req1 = createPostRequest(
            'https://notifier.triveca.ovh',
            '/sensorrpi3juanjo?topic=temperature',
            {id: 'sensorrpi3juanjo', sensorType: 'temperature', sensorValue: 24.4},
            {'content-type': 'application/json', 'x-appid': 'tribeca'},
            200,
            {code: 200, message: 'request POST JSON saved'},
            {'content-type': 'application/json'}
        );
        const req2 = createPostRequest(
            'https://notifier.triveca.ovh',
            '/sensorrpi3juanjo?topic=temperature',
            'id=sensorrpi3juanjo&sensorType=temperature&sensorValue=24.4',
            {'content-type': 'application/x-www-form-urlencoded'},
            200,
            {code: 200, message: 'request POST URL ENCODED saved'},
            {'content-type': 'application/json'}
        );

        const response = await server.inject({
            method: 'PUT',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({
            id: 'sensorrpi3juanjo',
            responses: [
                'request POST JSON saved',
                'request POST URL ENCODED saved'
            ]
        });
    });

    it('should return 200 with custom body response when receive a GET and fire a DELETE and POST in serie', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: { sensorId: 'sensorrpi3juanjo' },
            body: {
                type: 'temperature',
                value: 24.4,
                timestamp: 123456789
            },
            headers: {'X-APPID': 'tribeca', 'Content-Type': 'application/json'}
        };
        const flow1 = await createFakeFlow(
            mappingsCollection,
            targetsCollection,
            undefined,
            '{"X-APPID":"{{headers[\'x-appid\']}}"}',
            'https://notifier.triveca.ovh/{{params.sensorId}}?topic={{body.type}}',
            'DELETE'
        );
        const flow2 = await createFakeFlow(
            mappingsCollection,
            targetsCollection,
            'id={{params.sensorId}}&sensorType={{body.type}}&sensorValue={{body.value}}',
            '{"Content-Type": "application/x-www-form-urlencoded", "X-APPID":"{{headers[\'X-APPID\']}}"}',
            'https://notifier.triveca.ovh/{{params.sensorId}}?topic={{body.type}}',
            'POST'
        );
        const responseMapping = await createFakeResponse(
            responsesCollection,
            '{"id":"{{params.sensorId}}", "responses": ["{{responses[0].response.body.message}}", "{{responses[1].response.body.message}}"]}',
            '{"content-type": "application/json"}'
        );

        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [flow1, flow2],
            responseId: responseMapping,
            serial: true
        });

        const req1 = createDeleteRequest(
            'https://notifier.triveca.ovh',
            '/sensorrpi3juanjo?topic=temperature',
            undefined,
            {'x-appid': 'tribeca'},
            200,
            {code: 200, message: 'request DELETE ok'},
            {'content-type': 'application/json'}
        );
        const req2 = createPostRequest(
            'https://notifier.triveca.ovh',
            '/sensorrpi3juanjo?topic=temperature',
            'id=sensorrpi3juanjo&sensorType=temperature&sensorValue=24.4',
            {'content-type': 'application/x-www-form-urlencoded'},
            200,
            {code: 200, message: 'request POST URL ENCODED saved'},
            {'content-type': 'application/json'}
        );

        const response = await server.inject({
            method: 'PUT',
            url: '/mappers/' + sourceInserted,
            query: context.params,
            payload: context.body,
            headers: context.headers
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({
            id: 'sensorrpi3juanjo',
            responses: [
                'request DELETE ok',
                'request POST URL ENCODED saved'
            ]
        });
    });
});
