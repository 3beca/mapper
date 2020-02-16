/* eslint-disable filenames/match-regex */
import { buildServer } from '../src/server';
import { createDependencies } from '../src/dependencies';

describe(
    'E2E Router mapper',
    () => {
        let deps, dbClient, mappingsCollection, sourcesCollection, targetsCollection, responsesCollection, server;
        let sourcesService, mappingsService, targetsService, responsesService, mapperService;
        beforeAll(
            async () => {
                deps = await createDependencies({DBNAME: 'test-e2e-route-mapper'});
                ({
                    dbClient,
                    mappingsCollection,
                    sourcesCollection,
                    targetsCollection,
                    responsesCollection,
                    sourcesService,
                    mappingsService,
                    targetsService,
                    responsesService,
                    mapperService
                } = deps([
                    'dbClient',
                    'mappingsCollection',
                    'sourcesCollection',
                    'targetsCollection',
                    'responsesCollection',
                    'sourcesService',
                    'mappingsService',
                    'targetsService',
                    'responsesService',
                    'mapperService'
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

        it(
            'should create a...',
            async () => {
                // Create mapping
                const responseMapping = await server.inject({
                    method: 'POST',
                    url: '/admin/mappings',
                    payload: {name: 'mapping-name', template: '{"type": {{params.sensorType}}, "value": {{params.value}}, "timestamp": {{params.timestamp}}}', type: 'json'}
                });
                const mapping = JSON.parse(responseMapping.payload);
                // console.log('ResponseMapping', mapping);
                // Create target
                const responseTarget = await server.inject({
                    method: 'POST',
                    url: '/admin/targets',
                    payload: {name: 'target-name', method: 'POST', headers: '{"content-type": "applicastion/json"}', url: 'http://tribeca.ovh'}
                });
                const target = JSON.parse(responseTarget.payload);
                // console.log('ResponseTarget', target);
                // Create response
                const responseResponse = await server.inject({
                    method: 'POST',
                    url: '/admin/responses',
                    headers: {'content-type': 'application/json'},
                    payload: {
                        name: 'response-name',
                        description: 'sample description',
                        status: '200',
                        template: 'Welcome to MAPPER: {{respponse.message}}',
                        headers: '{"content-type": "text"}'
                    }
                });
                const response = JSON.parse(responseResponse.payload);
                // console.log('ResponseResponse', response);
                // Create source
                const responseSource = await server.inject({
                    method: 'POST',
                    url: 'admin/sources',
                    headers: {'content-type': 'application/json'},
                    payload: {
                        name: 'avalidsourcefulloptions',
                        description: 'my first source map',
                        flows: [{mappingId: mapping._id, targetId: target._id}],
                        responseId: response._id,
                        serial: false
                    }
                });
                const source = JSON.parse(responseSource.payload);
                // console.log('ResponseSource', source);
                // run mapper
                const context = {};
                const responseMapperFlow = await server.inject({
                    method: 'POST',
                    url: source.url,
                    query: context.params,
                    payload: context.body,
                    headers: context.headers
                });
                const mapperFlow = responseMapperFlow.payload;//JSON.parse(responseMapperFlow.payload);
                // console.log('ResponseMapperFlow', mapperFlow);

                expect(mapperFlow).toBe('Welcome to MAPPER: ');
            }
        );
    }
);
