jest.mock('pino');
import { buildServer } from '../src/server';
import {
    connect,
    getAndSetupDatabase,
    COLLECTION_MAPPINGS,
    COLLECTION_SOURCES,
    COLLECTION_TARGETS
} from '../src/database';
import {
    ERROR_MAPPER,
    ERROR_DATABASE,
    ERROR_SOURCE_ID,
    ERROR_UNKNOWN
} from '../src/errors';
import { encodeError } from '../src/utils/error-encoder';
import config from '../src/config';
import { createPostRequest, createGetRequest } from '../tests-utils/mock-requsts';

describe('Route mapper', () => {
    let dbClient, db, mappingsCollection, sourcesCollection, targetsCollection, server;
    beforeAll(
        async () => {
            dbClient = await connect(config.mongodb.url);
            db = await getAndSetupDatabase(dbClient, 'test-route-mapper');
            mappingsCollection = db.collection(COLLECTION_MAPPINGS);
            sourcesCollection = db.collection(COLLECTION_SOURCES);
            targetsCollection = db.collection(COLLECTION_TARGETS);
            server = buildServer(sourcesCollection, mappingsCollection, targetsCollection);
        }
    );

    afterAll(
        async () => {
            db = null;
            await server.close();
            await dbClient.close();
        }
    );

    beforeEach(
        async () => {
            await mappingsCollection.deleteMany();
            await sourcesCollection.deleteMany();
            await targetsCollection.deleteMany();
        }
    );

    it('should return ERROR SOURCE_ID when sourceid not sent', async () => {
        const context = {
            params: {id: 25},
            body: {name: 'Juanjo', temperature: 25.5},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };
        const server = buildServer({}, {}, {});

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
                    details: 'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
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
        const server = buildServer({}, {}, {});

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
                    details: 'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
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
        const server = buildServer({}, {}, {});

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
                    details: 'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters'
                }
            )
        );
    });

    it('should return 400 Error when mongodb fails', async () => {
        const sourceId = '098765432103';
        const context = {
            params: {id: 25},
            body: {name: 'Juanjo', temperature: 25.5},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };
        const server = buildServer({}, {}, {});

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

    it('should return 204 when receive a GET, POST, PUT, PATCH or DELETE request and fire a POST request', async () => {
        const sourceName = 'testsourcename1';
        const context = {
            params: {id: 25},
            body: {name: 'Juanjo', temperature: 25.5},
            headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
        };
        const mapping = {
            name: 'mappingtest1',
            template: '{"senderName": "{{body.name}}", "temperature": {{body.temperature}}}'
        };
        const target = {
            name: 'targettest1',
            method: 'POST',
            headers: '{"content-type" : "application/json"}',
            url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
        };
        const { insertedId: mappingInserted} = await mappingsCollection.insertOne(mapping);
        const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
        const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
            name: sourceName,
            flows: [
                {mappingId: mappingInserted, targetId: targetInserted},
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
                  body: method === 'GET' ? null : { name: 'Juanjo', temperature: 25.5 },
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
                        body: method === 'GET' ? '{"senderName": "null", "temperature": null}' : '{"senderName": "Juanjo", "temperature": 25.5}',
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

    it('should return 204 when receive a POST with url encoded params request and fire a GET request', async () => {
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
});
