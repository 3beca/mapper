import { buildServer } from './server';
import { createDependencies } from './dependencies';
import config from './config';
import gracefulShutdown from './graceful-shutdown';
import logger from './logger';
import { registerFilters } from './utils/liquid-filters';

async function main() {
    const { port, host } = config.http;

    logger.info('starting Mapper service');
    registerFilters();

    const deps = await createDependencies();
    const server = buildServer(deps);
    await server.listen(port, host);

    logger.info('started MAPPER service. Listening at port', port);

    const {dbClient} = deps(['dbClient']);
    process.on('SIGTERM', gracefulShutdown(server, dbClient));
    process.on('SIGINT', gracefulShutdown(server, dbClient));
}

main().catch(error => {
    console.error('error while starting up', error);
    process.exit(1);
});
