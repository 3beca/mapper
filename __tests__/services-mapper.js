import {
    connect,
    getAndSetupDatabase,
    COLLECTION_MAPPINGS,
    COLLECTION_SOURCES,
    COLLECTION_TARGETS
} from '../src/database';
import config from '../src/config';
import {
    mapper
} from '../src/services/mapper';

describe(
    'mapper service should',
    () => {
        let dbClient, db, mappingsCollection, sourcesCollection, targetsCollection;
        beforeAll(
            async () => {
                dbClient = await connect(config.mongodb.url);
                db = await getAndSetupDatabase(dbClient, 'test-mapper-service');
                mappingsCollection = db.collection(COLLECTION_MAPPINGS);
                sourcesCollection = db.collection(COLLECTION_SOURCES);
                targetsCollection = db.collection(COLLECTION_TARGETS);
            }
        );

        afterAll(
            async () => {
                db = null;
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

        it(
            'retrun an empty array of requests when no request sent',
            async () => {
                const sourceName = 'testsourcename1';
                const sourceRequest = undefined;

                const response = await mapper(sourceName, sourceRequest, sourcesCollection, mappingsCollection, targetsCollection);

                expect(response).toEqual([]);
            }
        );

        it(
            'retrun an empty array of requests when no  body, params or headers',
            async () => {
                const sourceName = 'testsourcename1';
                const sourceRequest = {};

                const response = await mapper(sourceName, sourceRequest, sourcesCollection, mappingsCollection, targetsCollection);

                expect(response).toEqual([]);
            }
        );

        it(
            'retrun an empty array of requests when no source found',
            async () => {
                const sourceName = 'testsourcename1';
                const sourceRequest = {
                    params: {},
                    body: {},
                    headers: {}
                };

                const response = await mapper(sourceName, sourceRequest, sourcesCollection, mappingsCollection, targetsCollection);

                expect(response).toEqual([]);
            }
        );

        it(
            'retrun an array of one request when source found',
            async () => {
                const sourceName = 'testsourcename1';
                const sourceRequest = {
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
                await targetsCollection.insertOne(target);
                await mappingsCollection.insertOne(mapping);
                await sourcesCollection.insertOne({name: sourceName, flows: [{targetName: target.name, mappingName: mapping.name}]});

                const {requests} = await mapper(sourceName, sourceRequest, sourcesCollection, mappingsCollection, targetsCollection);

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
            'retrun an array of one request when source found without body',
            async () => {
                const sourceName = 'testsourcename1';
                const sourceRequest = {
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
                await targetsCollection.insertOne(target);
                await mappingsCollection.insertOne(mapping);
                await sourcesCollection.insertOne({name: sourceName, flows: [{targetName: target.name, mappingName: mapping.name}]});

                const {requests} = await mapper(sourceName, sourceRequest, sourcesCollection, mappingsCollection, targetsCollection);

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
            'retrun an array of one request and one error',
            async () => {
                const sourceName = 'testsourcename1';
                const sourceRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'Content-type': 'application/json'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"sendorName": "{{body.name}}", "temperature": {{body.temperature}}}'
                };
                const target = {
                    name: 'targettest1',
                    method: 'POST',
                    headers: '{"Content-Type" : "application/json"}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };
                await targetsCollection.insertOne(target);
                await mappingsCollection.insertOne(mapping);
                await sourcesCollection.insertOne({
                    name: sourceName,
                    flows: [
                        {targetName: target.name, mappingName: mapping.name},
                        {targetName: 'invalid', mappingName: 'invalid'}
                    ]
                });

                const {requests, errors} = await mapper(sourceName, sourceRequest, sourcesCollection, mappingsCollection, targetsCollection);

                expect(Array.isArray(requests)).toBe(true);
                expect(requests.length).toBe(1);
                expect(requests).toEqual(expect.arrayContaining([
                    {
                        method: 'POST',
                        url: 'https://notifier.triveca.ovh/25?date=123456789',
                        body: '{"sendorName": "Juanjo", "temperature": 25.5}',
                        headers: expect.objectContaining({'Content-Type': 'application/json'})
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
                                    mapping: 'invalid',
                                    source: 'testsourcename1',
                                    target: 'invalid'
                                }
                            }
                        ]
                    })
                );
            }
        );

        it(
            'retrun an array of two errors, one for flow not found and other for error parsing json',
            async () => {
                const sourceName = 'testsourcename1';
                const sourceRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'Content-type': 'application/json'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"sendorName": "{{body.name}}" "temperature": {{body.temperature}}}'
                };
                const target = {
                    name: 'targettest1',
                    method: 'POST',
                    headers: '{"Content-Type" : "application/json"}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };
                await targetsCollection.insertOne(target);
                await mappingsCollection.insertOne(mapping);
                await sourcesCollection.insertOne({
                    name: sourceName,
                    flows: [
                        {targetName: target.name, mappingName: mapping.name},
                        {targetName: 'invalid', mappingName: 'invalid'}
                    ]
                });

                const {errors} = await mapper(sourceName, sourceRequest, sourcesCollection, mappingsCollection, targetsCollection);

                expect(Array.isArray(errors.errors)).toBe(true);
                expect(errors.errors.length).toBe(2);
                expect(errors).toEqual(
                    expect.objectContaining({
                        errors: [
                            {
                                code: 1001,
                                message: 'Error transforming source',
                                meta: {
                                    details: 'Error parsing body from mapping template: Unexpected string in JSON at position 24',
                                    mapping: 'mappingtest1',
                                    source: 'testsourcename1',
                                    target: 'targettest1'
                                }
                            },
                            {
                                code: 1001,
                                message: 'Error transforming source',
                                meta: {
                                    details: 'Error target not found',
                                    mapping: 'invalid',
                                    source: 'testsourcename1',
                                    target: 'invalid'
                                }
                            }
                        ]
                    })
                );
            }
        );

        it(
            'throw an error when mongodb fails',
            async () => {
                expect.assertions(1);
                const sourceName = 'testsourcename1';
                const sourceRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25.5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca', 'Content-type': 'application/json'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"sendorName": "{{body.name}}" "temperature": {{body.temperature}}}'
                };
                const target = {
                    name: 'targettest1',
                    method: 'POST',
                    headers: '{"Content-Type" : "application/json"}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const fakeSourceCollection = {findOne: jest.fn().mockRejectedValue(new Error('Mongo error'))};

                try {
                    await mapper(sourceName, sourceRequest, fakeSourceCollection, mappingsCollection, targetsCollection);
                }
                catch (error) {
                    expect(error.message).toEqual('Mongo error');
                }
            }
        );
    }
);
