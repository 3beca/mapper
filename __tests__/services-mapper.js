import { createDependencies } from '../src/dependencies';
import { buildMapperService } from '../src/services/mapper';
import { buildMappingsService } from '../src/services/mappings';
import { buildTargetsService } from '../src/services/targets';

describe.skip(
    'mapper service should',
    () => {
        let deps,
            dbClient,
            mappingsCollection,
            targetsCollection,
            mapperService;
        beforeAll(
            async () => {
                deps = await createDependencies({DBNAME: 'test-mapper-service'});
                ({
                    mappingsCollection,
                    targetsCollection,
                    mapperService
                } = deps([
                    'mappingsCollection',
                    'targetsCollection',
                    'mapperService'
                ]));
            }
        );

        afterAll(
            async () => {
                await dbClient.close();
            }
        );

        beforeEach(
            async () => {
                await mappingsCollection.deleteMany();
                await targetsCollection.deleteMany();
            }
        );

        it(
            'return an empty array of requests when no request sent',
            async () => {
                const sourceId = '123456789012';
                const source = {
                    _id: sourceId,
                    flows: [{mappingId: '123456789098', targetId: '123456543213'}]
                };
                const context = undefined;

                const {requests} = await mapperService(source, context);

                expect(requests).toEqual([]);
            }
        );

        it(
            'return an empty array of requests when no  body, params nor headers',
            async () => {
                const sourceId = '123456789012';
                const source = {
                    _id: sourceId,
                    flows: []
                };
                const context = {};

                const {requests} = await mapperService(source, context);

                expect(requests).toEqual([]);
            }
        );

        it(
            'return an empty array of requests when no source found',
            async () => {
                const context = {
                    params: {},
                    body: {},
                    headers: {}
                };

                const {requests} = await mapperService(null, context);

                expect(requests).toEqual([]);
            }
        );

        it(
            'return an array of one request when source found',
            async () => {
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target = {
                    name: 'targettest1',
                    method: 'POST',
                    headers: undefined,
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };
                const { insertedId: mappingInserted} = await mappingsCollection.insertOne(mapping);
                const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
                const source = {_id: '123456789876', name: sourceName, flows: [{mappingId: mappingInserted, targetId: targetInserted}]};

                const {requests} = await mapperService(source, context);

                expect(Array.isArray(requests)).toBe(true);
                expect(requests.length).toBe(1);
                expect(requests).toEqual(expect.arrayContaining([
                    {
                        method: 'POST',
                        url: 'https://notifier.triveca.ovh/25?date=123456789',
                        body: '<html><body><div>Hello Juanjo</div><div>Estas a 25ºC en tu casa',
                        headers: undefined
                      }
                ]));
            }
        );

        it(
            'return an array of one request when source found without body',
            async () => {
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target = {
                    name: 'targettest1',
                    method: 'POST',
                    headers: undefined,
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };
                const { insertedId: mappingInserted} = await mappingsCollection.insertOne(mapping);
                const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
                const source = {_id: '012345678947', name: sourceName, flows: [{mappingId: mappingInserted, targetId: targetInserted}]};

                const {requests} = await mapperService(source, context);

                expect(Array.isArray(requests)).toBe(true);
                expect(requests.length).toBe(1);
                expect(requests).toEqual(expect.arrayContaining([
                    {
                        method: 'POST',
                        url: 'https://notifier.triveca.ovh/25?date=123456789',
                        body: '<html><body><div>Hello null</div><div>Estas a nullºC en tu casa',
                        headers: undefined
                      }
                ]));
            }
        );

        it(
            'return an array of one request and one error when target not found',
            async () => {
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"sendorName": "{{body.name}}", "temperature": {{body.temperature}}}'
                };
                const target = {
                    name: 'targettest1',
                    method: 'POST',
                    headers: '{"content-type" : "application/json"}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };
                const { insertedId: mappingInserted} = await mappingsCollection.insertOne(mapping);
                const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
                const source = {
                    _id: '123456789098',
                    name: sourceName,
                    flows: [
                        {mappingId: mappingInserted, targetId: targetInserted},
                        {mappingId: '123456789158', targetId: '098765432165'}
                    ]
                };

                const {requests, errors} = await mapperService(source, context);

                expect(Array.isArray(requests)).toBe(true);
                expect(requests.length).toBe(1);
                expect(requests).toEqual(expect.arrayContaining([
                    {
                        method: 'POST',
                        url: 'https://notifier.triveca.ovh/25?date=123456789',
                        body: '{"sendorName": "Juanjo", "temperature": 25.5}',
                        headers: expect.objectContaining({'content-type': 'application/json'})
                      }
                ]));
                expect(Array.isArray(errors.errors)).toBe(true);
                expect(errors.errors.length).toBe(1);
                expect(errors).toEqual(
                    expect.objectContaining({
                        errors: [
                            {
                                code: 1001,
                                message: 'Error transforming source',
                                meta: {
                                    details: 'Error target not found',
                                    mapping: '123456789158',
                                    source: source._id,
                                    target: '098765432165'
                                }
                            }
                        ]
                    })
                );
            }
        );

        it(
            'return an array of two errors, one for flow not found and other for error parsing json',
            async () => {
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"sendorName": "{{body.name}}" "temperature": {{body.temperature}}}'
                };
                const target = {
                    name: 'targettest1',
                    method: 'POST',
                    headers: '{"content-type" : "application/json"}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };
                const { insertedId: mappingInserted} = await mappingsCollection.insertOne(mapping);
                const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
                const source = {
                    _id: '123456789876',
                    name: sourceName,
                    flows: [
                        {mappingId: mappingInserted, targetId: targetInserted},
                        {mappingId: '123456789158', targetId: '098765432165'}
                    ]
                };

                const {errors} = await mapperService(source, context);

                expect(Array.isArray(errors.errors)).toBe(true);
                expect(errors.errors.length).toBe(2);
                expect(errors).toEqual(
                    expect.objectContaining({
                        errors: [
                            {
                                code: 1001,
                                message: 'Error transforming source',
                                meta: {
                                    details: 'Error parsing body from mapping template: Unexpected string in JSON at position 24, body: {"sendorName": "Juanjo" "temperature": 25.5}',
                                    mapping: mappingInserted,
                                    source: source._id,
                                    target: targetInserted
                                }
                            },
                            {
                                code: 1001,
                                message: 'Error transforming source',
                                meta: {
                                    details: 'Error target not found',
                                    mapping: '123456789158',
                                    source: source._id,
                                    target: '098765432165'
                                }
                            }
                        ]
                    })
                );
            }
        );

        it(
            'return an array of one error when target not found',
            async () => {
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
                };
                const source = {
                    _id: '123456789876',
                    name: sourceName,
                    flows: [
                        {mappingId: null, targetId: null},
                    ]
                };

                const {errors} = await mapperService(source, context);

                expect(Array.isArray(errors.errors)).toBe(true);
                expect(errors.errors.length).toBe(1);
                expect(errors).toEqual(
                    expect.objectContaining({
                        errors: [
                            {
                                code: 1001,
                                message: 'Error transforming source',
                                meta: {
                                    details: 'Error target not found',
                                    mapping: null,
                                    source: source._id,
                                    target: null
                                }
                            }
                        ]
                    })
                );
            }
        );

        it(
            'return an array of one error when mapping but target not declared',
            async () => {
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
                };
                const source = {
                    _id: '123456789876',
                    name: sourceName,
                    flows: [{mappingId: '123456789087'}]
                };

                const {errors} = await mapperService(source, context);

                expect(Array.isArray(errors.errors)).toBe(true);
                expect(errors.errors.length).toBe(1);
                expect(errors).toEqual(
                    expect.objectContaining({
                        errors: [
                            {
                                code: 1001,
                                message: 'Error transforming source',
                                meta: {
                                    details: 'Error target not found',
                                    mapping: '123456789087',
                                    source: source._id,
                                    target: undefined
                                }
                            }
                        ]
                    })
                );
            }
        );

        it(
            'return an empty array when no flow declared',
            async () => {
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
                };
                const source = {
                    _id: '123456789876',
                    name: sourceName,
                    flows: []
                };

                const {requests, errors} = await mapperService(source, context);

                expect(Array.isArray(requests)).toBe(true);
                expect(requests.length).toBe(0);
                expect(errors).toBe(undefined);
            }
        );

        it(
            'return an array of one request whitout body when no mapping found',
            async () => {
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
                };
                const target = {
                    name: 'targettest1',
                    method: 'GET',
                    headers: '{"content-type" : "application/json"}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };
                const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
                const source = {
                    _id: '123456789098',
                    name: sourceName,
                    flows: [
                        {mappingId: null, targetId: targetInserted}
                    ]
                };

                const {requests} = await mapperService(source, context);

                expect(Array.isArray(requests)).toBe(true);
                expect(requests.length).toBe(1);
                expect(requests).toEqual(expect.arrayContaining([
                    {
                        method: 'GET',
                        url: 'https://notifier.triveca.ovh/25?date=123456789',
                        headers: expect.objectContaining({'content-type': 'application/json'}),
                        body: undefined
                    }
                ]));
            }
        );

        it(
            'return an array of one request whitout body when no mapping declared',
            async () => {
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
                };
                const target = {
                    name: 'targettest1',
                    method: 'GET',
                    headers: '{"content-type" : "application/json"}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };
                const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
                const source = {
                    _id: '123456789098',
                    name: sourceName,
                    flows: [
                        {targetId: targetInserted}
                    ]
                };

                const {requests} = await mapperService(source, context);

                expect(Array.isArray(requests)).toBe(true);
                expect(requests.length).toBe(1);
                expect(requests).toEqual(expect.arrayContaining([
                    {
                        method: 'GET',
                        url: 'https://notifier.triveca.ovh/25?date=123456789',
                        headers: expect.objectContaining({'content-type': 'application/json'}),
                        body: undefined
                    }
                ]));
            }
        );

        it(
            'throw an error when mongodb fails',
            async () => {
                expect.assertions(1);
                const sourceId = '098765432145';
                const sourceName = 'testsourcename1';
                const context = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'content-type': 'application/json'}
                };
                const source = {
                    _id: '123456789098',
                    name: sourceName,
                    flows: [
                        {mappingId: '123456789098', targetId: '123456789098'}
                    ]
                };

                const fakeCollection = {findOne: jest.fn().mockRejectedValue(new Error('Mongo error'))};
                const mappingsService = buildMappingsService(fakeCollection);
                const targetsService = buildTargetsService(fakeCollection);

                try {
                    await buildMapperService(mappingsService, targetsService)(source, context);
                }
                catch (error) {
                    expect(error.message).toEqual('Mongo error');
                }
            }
        );
    }
);
