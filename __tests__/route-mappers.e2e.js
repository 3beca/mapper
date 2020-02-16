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
            'should create a POST request from a POST request with custom response',
            async () => {
                // Create mapping
                const responseMapping = await server.inject({
                    method: 'POST',
                    url: '/admin/mappings',
                    payload: {name: 'mapping-name', template: '{"type": {{params.sensorType}}, "value": {{params.value}}, "timestamp": {{params.timestamp}}}', type: 'json'}
                });
                const mapping = JSON.parse(responseMapping.payload);
                // Create target
                const responseTarget = await server.inject({
                    method: 'POST',
                    url: '/admin/targets',
                    payload: {name: 'target-name', method: 'POST', headers: '{"content-type": "applicastion/json"}', url: 'http://tribeca.ovh'}
                });
                const target = JSON.parse(responseTarget.payload);
                // Create response
                const responseResponse = await server.inject({
                    method: 'POST',
                    url: '/admin/responses',
                    headers: {'content-type': 'application/json'},
                    payload: {
                        name: 'response-name',
                        description: 'sample description',
                        status: '200',
                        template: 'Welcome to MAPPER: {{response.message}}',
                        headers: '{"content-type": "text"}'
                    }
                });
                const response = JSON.parse(responseResponse.payload);
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
                // run mapper
                const context = {

                };
                const responseMapperFlow = await server.inject({
                    method: 'POST',
                    url: source.url,
                    query: context.params,
                    payload: context.body,
                    headers: context.headers
                });
                const mapperFlow = responseMapperFlow.payload;

                expect(mapperFlow).toBe('Welcome to MAPPER: ');
            }
        );

        it(
            'should create a GET request from a POST request without response',
            async () => {
                // Create target
                const responseTarget = await server.inject({
                    method: 'POST',
                    url: '/admin/targets',
                    payload: {name: 'target-name', method: 'GET', url: 'http://google.es?q={{body.search}}'}
                });
                const target = JSON.parse(responseTarget.payload);
                // Create source
                const responseSource = await server.inject({
                    method: 'POST',
                    url: 'admin/sources',
                    headers: {'content-type': 'application/json'},
                    payload: {
                        name: 'googlefinder',
                        description: 'Search text in google',
                        flows: [{targetId: target._id}],
                        serial: false
                    }
                });
                const source = JSON.parse(responseSource.payload);
                // run mapper
                const context = {
                    body: { search: 'juanjofp'}
                };
                const responseMapperFlow = await server.inject({
                    method: 'POST',
                    url: source.url,
                    query: context.params,
                    payload: context.body,
                    headers: context.headers
                });
                const mapperFlow = JSON.parse(responseMapperFlow.payload);

                expect(responseMapperFlow.statusCode).toBe(200);
                expect(mapperFlow.delivered.length).toBe(1);
            }
        );

        it.skip(
            'should create a POST for influxDBfrom a CEP request without response',
            async () => {
                // Create target
                const responseMapping = await server.inject({
                    method: 'POST',
                    headers: {'content-type': 'application/json'},
                    url: '/admin/mappings',
                    payload: {name: 'influxDB-write', template: 'cpu_load_short,host=server01,region=us-west value={{body.value}} {{body.timestamp}}'}
                });
                const mapping = JSON.parse(responseMapping.payload);
                // curl -i -XPOST 'http://localhost:8086/write?db=tribeca' --data-binary 'cpu_load_short,host=server01,region=us-west value=0.64 1434055562000000000'
                const responseTarget = await server.inject({
                    method: 'POST',
                    headers: {'content-type': 'application/json'},
                    url: '/admin/targets',
                    payload: {name: 'influxdb-tribeca-server', method: 'POST', url: 'http://localhost:8086/write?db=tribeca', headers: '{"content-type": "text"}'}
                });
                const target = JSON.parse(responseTarget.payload);
                // Create source
                const responseSource = await server.inject({
                    method: 'POST',
                    url: 'admin/sources',
                    headers: {'content-type': 'application/json'},
                    payload: {
                        name: 'influxdb-write-from-cep',
                        description: 'Write output from CEP into InfluxDB',
                        flows: [{targetId: target._id, mappingId: mapping._id}],
                        serial: false
                    }
                });
                const source = JSON.parse(responseSource.payload);
                // run mapper
                const context = {
                    body: { value: 6.14, timestamp: Date.now() * 1000000}
                };
                const responseMapperFlow = await server.inject({
                    method: 'POST',
                    url: source.url,
                    query: context.params,
                    payload: context.body,
                    headers: context.headers
                });
                const mapperFlow = JSON.parse(responseMapperFlow.payload);
                //console.log('ResponseMapperFlow', mapperFlow, responseMapperFlow.payload);

                expect(responseMapperFlow.statusCode).toBe(200);
                expect(mapperFlow.delivered.length).toBe(1);
            }
        );
    }
);


// curl -G 'http://localhost:8086/query?pretty=true' --data-urlencode "db=tribeca" --data-urlencode "q=SELECT \"value\" FROM \"cpu_load_short\" WHERE \"region\"='us-west'"