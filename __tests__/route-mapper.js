jest.mock('pino');
import { buildServer } from '../src/server';
import {
    connect,
    getAndSetupDatabase,
    COLLECTION_MAPPINGS,
    COLLECTION_SOURCES,
    COLLECTION_TARGETS
} from '../src/database';
import config from '../src/config';

describe('Route mapper', () => {
    let dbClient, db, mappingsCollection, sourcesCollection, targetsCollection, server;
    beforeAll(
        async () => {
            dbClient = await connect(config.mongodb.url);
            db = await getAndSetupDatabase(dbClient, 'test-route-mapper');
            mappingsCollection = db.collection(COLLECTION_MAPPINGS);
            sourcesCollection = db.collection(COLLECTION_SOURCES);
            targetsCollection = db.collection(COLLECTION_TARGETS);
            server = buildServer();
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

    it('should return 204 when receive a POST request', async () => {
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

        const response = await server.inject({
            method: 'POST',
            url: '/mappers/' + sourceName,
            query: sourceRequest.params,
            payload: sourceRequest.body,
            headers: sourceRequest.headers
        });

        expect(response.statusCode).toBe(200);
    });

    it('should return 200 when receive a PUT request', async () => {
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

        const response = await server.inject({
            method: 'GET',
            url: '/mappers/' + sourceName,
            query: sourceRequest.params,
            payload: sourceRequest.body,
            headers: sourceRequest.headers
        });

        expect(response.statusCode).toBe(200);
    });
});
