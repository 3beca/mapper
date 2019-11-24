import { buildServer } from './server';
import config from './config';
import gracefulShutdown from './graceful-shutdown';
import {
    connect,
    getAndSetupDatabase,
    COLLECTION_SOURCES,
    COLLECTION_MAPPINGS,
    COLLECTION_TARGETS,
    COLLECTION_RESPONSES
} from './database';
import { buildSourcesService } from './services/sources';
import { buildMappingsService } from './services/mappings';
import { buildTargetsService } from './services/targets';
import { buildResponsesService } from './services/responses';
import logger from './logger';

async function main() {
    const { port, host } = config.http;
    const { url, databaseName } = config.mongodb;

    logger.info('starting Mapper service');

    const dbClient = await connect(url);
    const db = await getAndSetupDatabase(dbClient, databaseName);
    const sourcesService = buildSourcesService(db.collection(COLLECTION_SOURCES));
    const mappingsService = buildMappingsService(db.collection(COLLECTION_MAPPINGS));
    const targetsService = buildTargetsService(db.collection(COLLECTION_TARGETS));
    const responsesService = buildResponsesService(db.collection(COLLECTION_RESPONSES));
    const server = buildServer(
        sourcesService,
        mappingsService,
        targetsService,
        responsesService
    );
    await server.listen(port, host);

    logger.info('started MAPPER service. Listening at port', port);

    process.on('SIGTERM', gracefulShutdown(server, dbClient));
    process.on('SIGINT', gracefulShutdown(server, dbClient));
}

main().catch(error => {
    console.error('error while starting up', error);
    process.exit(1);
});
