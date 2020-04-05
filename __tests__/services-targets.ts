import { createDependencies } from '../src/dependencies';
import {
    buildTargetsService, Target, TargetsService
} from '../src/services/targets';
import {
    ERROR_DATABASE,
    ERROR_TARGET_FORMAT,
    typeOfError
} from '../src/errors';
import { Collection, MongoClient } from 'mongodb';

describe(
    'getTargets should',
    () => {
        let dbClient: MongoClient, collection: Collection, service: TargetsService;
        beforeAll(
            async () => {
                const deps = await createDependencies({DBNAME: 'test-targets-service-all'});
                ({
                    dbClient,
                    targetsCollection: collection,
                    targetsService: service
                } = deps(['dbClient', 'targetsCollection', 'targetsService']));
            }
        );

        afterEach(
            async () => {
                await collection.deleteMany({});
            }
        );

        afterAll(
            async () => {
                await dbClient.close();
            }
        );

        it(
            'return an empty array when no targets',
            async () => {
                const targets = await service.getTargets();
                expect(targets).toEqual([]);
            }
        );

        it(
            'return an Error array when database fails',
            async () => {
                expect.assertions(1);
                const service = buildTargetsService({} as Collection);

                try {
                    await service.getTargets();
                }
                catch (error) {
                    expect(typeOfError(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return an array with all targets',
            async () => {
                const expectedtargets = [
                    {
                        name: 'nameforTargets1',
                        description: '',
                        template: ''
                    },
                    {
                        name: 'nameforTargets2',
                        description: '',
                        template: ''
                    }
                ];
                await collection.insertMany(expectedtargets);

                const targets = await service.getTargets();

                expect(targets).toEqual(expectedtargets);
            }
        );
    }
);

describe(
    'getTargetById should',
    () => {
        let dbClient: MongoClient, collection: Collection, service: TargetsService;
        beforeAll(
            async () => {
                const deps = await createDependencies({DBNAME: 'test-targets-service-byid'});
                ({
                    dbClient,
                    targetsCollection: collection,
                    targetsService: service
                } = deps(['dbClient', 'targetsCollection', 'targetsService']));
            }
        );

        afterEach(
            async () => {
                await collection.deleteMany({});
            }
        );

        afterAll(
            async () => {
                await dbClient.close();
            }
        );

        it(
            'return null when undefined Targets id',
            async () => {
                const targetsId = undefined as unknown as string;
                const targets = await service.getTargetById(targetsId);
                expect(targets).toEqual(null);
            }
        );

        it(
            'return Error when invalid Targets id',
            async () => {
                expect.assertions(1);
                const targetsId = 'invalidTargetsid';
                try {
                    await service.getTargetById(targetsId);
                }
                catch (error) {
                    expect(typeOfError(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return null when Targets not found',
            async () => {
                const targetsId = '123456789098';
                const targets = await service.getTargetById(targetsId);
                expect(targets).toEqual(null);
            }
        );

        it(
            'return null when database fails',
            async () => {
                expect.assertions(1);
                const targetsId = '123456789098';
                const service = buildTargetsService({} as Collection);

                try {
                    await service.getTargetById(targetsId);
                }
                catch (error) {
                    expect(typeOfError(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return the Targets from the id',
            async () => {
                const expectedTargets = {
                        name: 'nameforTargets1',
                        description: '',
                        template: ''
                    };
                const { insertedId } = await collection.insertOne(expectedTargets);

                const targets = await service.getTargetById(insertedId);

                expect(targets).toEqual({...expectedTargets, _id: insertedId});
            }
        );
    }
);

describe(
    'insertTarget should',
    () => {
        let dbClient: MongoClient, collection: Collection, service: TargetsService;
        beforeAll(
            async () => {
                const deps = await createDependencies({DBNAME: 'test-targets-service-insert'});
                ({
                    dbClient,
                    targetsCollection: collection,
                    targetsService: service
                } = deps(['dbClient', 'targetsCollection', 'targetsService']));
            }
        );

        afterEach(
            async () => {
                await collection.deleteMany({});
            }
        );

        afterAll(
            async () => {
                await dbClient.close();
            }
        );

        it(
            'return an Error array when database fails',
            async () => {
                expect.assertions(1);
                const service = buildTargetsService({} as Collection);

                try {
                    await service.insertTarget({} as Target);
                }
                catch (error) {
                    expect(typeOfError(error, ERROR_DATABASE.type)).toBe(true);
                }
            }
        );

        it(
            'return an Error array when target is null',
            async () => {
                expect.assertions(1);
                const target = null as unknown as Target;

                try {
                    await service.insertTarget(target);
                }
                catch (error) {
                    expect(typeOfError(error, ERROR_TARGET_FORMAT.type)).toBe(true);
                }
            }
        );

        it(
            'return an Error array when target is undefined',
            async () => {
                expect.assertions(1);
                const target = undefined as unknown as Target;

                try {
                    await service.insertTarget(target);
                }
                catch (error) {
                    expect(typeOfError(error, ERROR_TARGET_FORMAT.type)).toBe(true);
                }
            }
        );

        it(
            'return the object inserted in database',
            async () => {
                const targetObject = {
                    name: 'CEP-Notifier-target',
                    description: 'Transform CEP body in Notifier Body',
                    method: 'GET',
                    headers: '{"content-type": "application/json", "appid": "3beca"',
                    url: 'http://'
                };

                const targetInserted = await service.insertTarget(targetObject);

                expect(targetInserted).toEqual({
                    _id: expect.anything(),
                    name: targetInserted.name,
                    description: targetInserted.description,
                    method: targetInserted.method,
                    headers: targetInserted.headers,
                    url: targetInserted.url
                });
            }
        );
    }
);
