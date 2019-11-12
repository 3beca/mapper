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
    ERROR_SOURCE_ID
} from '../src/errors';
import { encodeError } from '../src/utils/error-encoder';
import config from '../src/config';
import { createPostRequest } from '../tests-utils/mock-requsts';

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
        const sourceName = 'testsourcename1';
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
        const sourceName = 'testsourcename1';
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

    it('should return 400 Error when mongodb fails', async () => {
        const sourceId = '098765432103';
        const sourceName = 'testsourcename1';
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

    it('should return 204 when receive a GET, POST, PUT, PATCH or DELETE request', async () => {
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

        for (const method of [ 'POST', 'PUT', 'PATCH', 'DELETE']) {
            const req1 = createPostRequest(
                'https://notifier.triveca.ovh',
                '/25?date=123456789',
                {senderName: context.body.name, temperature: context.body.temperature},
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
            console.log('Response Body', JSON.parse(response.payload));
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
                            'Content-Type': 'application/json'
                        }
                    },
                    response: {
                        headers: {},
                        body: ''
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
});
