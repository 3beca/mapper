import {
    connect,
    getAndSetupDatabase,
    COLLECTION_RESPONSES
} from '../src/database';
import config from '../src/config';
import {
    buildResponsesService
} from '../src/services/responses';
import { typeOf } from '../src/utils/error-encoder';
import { ERROR_DATABASE } from '../src/errors';

describe(
    'getresponses should',
    () => {
        let dbClient, db, collection, service;
        beforeAll(
            async () => {
                dbClient = await connect(config.mongodb.url);
                db = await getAndSetupDatabase(dbClient, 'test-getresponses');
                collection = db.collection(COLLECTION_RESPONSES);
                service = buildResponsesService(collection);
            }
        );

        afterAll(
            async () => {
                await collection.deleteMany();
                db = null;
                await dbClient.close();
            }
        );

        it(
            'return an empty array when no responses',
            async () => {
                const responses = await service.getResponses();
                expect(responses).toEqual([]);
            }
        );

        it(
            'return an Error array when database fails',
            async () => {
                expect.assertions(1);
                const service = buildResponsesService({});

                try {
                    await service.getResponses();
                }
                catch (error) {
                    expect(typeOf(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return an array with all responses',
            async () => {
                const expectedresponses = [
                    {
                        name: 'nameforresponse1',
                        description: '',
                        template: ''
                    },
                    {
                        name: 'nameforresponse2',
                        description: '',
                        template: ''
                    }
                ];
                await collection.insertMany(expectedresponses);

                const responses = await service.getResponses(collection);

                expect(responses).toEqual(expectedresponses);
            }
        );
    }
);

describe(
    'getResponseById should',
    () => {
        let dbClient, db, collection, service;
        beforeAll(
            async () => {
                dbClient = await connect(config.mongodb.url);
                db = await getAndSetupDatabase(dbClient, 'test-getresponse-byid');
                collection = db.collection(COLLECTION_RESPONSES);
                service = buildResponsesService(collection);
            }
        );

        afterAll(
            async () => {
                await collection.deleteMany();
                db = null;
                await dbClient.close();
            }
        );

        it(
            'return null when undefined response id',
            async () => {
                const responseId = undefined;
                const response = await service.getResponseById(responseId);
                expect(response).toEqual(null);
            }
        );

        it(
            'return Error when invalid response id',
            async () => {
                expect.assertions(1);
                const responseId = 'invalidresponseid';
                try {
                    const response = await service.getResponseById(responseId);
                }
                catch (error) {
                    expect(typeOf(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return null when response not found',
            async () => {
                const responseId = '123456789098';
                const response = await service.getResponseById(responseId);
                expect(response).toEqual(null);
            }
        );

        it(
            'return null when database fails',
            async () => {
                expect.assertions(1);
                const responseId = '123456789098';
                const service = buildResponsesService({});

                try {
                    await service.getResponseById(responseId);
                }
                catch (error) {
                    expect(typeOf(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return the response from the id',
            async () => {
                const expectedresponse = {
                        name: 'nameforresponse1',
                        description: '',
                        template: ''
                    };
                const { insertedId } = await collection.insertOne(expectedresponse);

                const responses = await service.getResponseById(insertedId);

                expect(responses).toEqual({...expectedresponse, _id: insertedId});
            }
        );
    }
);
