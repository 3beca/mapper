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
import logger from './logger';

async function main() {
    const { port, host } = config.http;
    const { url, databaseName } = config.mongodb;

    logger.info('starting mapper service');

    const dbClient = await connect(url);
    const db = await getAndSetupDatabase(dbClient, databaseName);
    const server = buildServer(
        db.collection(COLLECTION_SOURCES),
        db.collection(COLLECTION_MAPPINGS),
        db.collection(COLLECTION_TARGETS),
        db.collection(COLLECTION_RESPONSES)
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
