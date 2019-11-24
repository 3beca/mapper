import config from './config';
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
import { buildMapperService } from './services/mapper';
import { buildRequesterService } from './services/requester';
import { buildHttpEngineService } from './services/http-engine';

export async function createDependencies(
    {
        DBNAME = undefined,
        SOURCES = COLLECTION_SOURCES,
        MAPPINGS = COLLECTION_MAPPINGS,
        TARGETS = COLLECTION_TARGETS,
        RESPONSES = COLLECTION_RESPONSES
    } = {}
) {
    const { url, databaseName } = config.mongodb;
    const loadedDeps = Object.create(null);
    loadedDeps.config = {
        DBNAME: DBNAME || databaseName,
        SOURCES: SOURCES,
        MAPPING: MAPPINGS,
        TARGETS: TARGETS,
        RESPONSES: RESPONSES
    };
    loadedDeps.dbClient = await connect(url);
    loadedDeps.db = await getAndSetupDatabase(loadedDeps.dbClient, loadedDeps.config.DBNAME);
    loadedDeps.sourcesCollection = loadedDeps.db.collection(SOURCES);
    loadedDeps.sourcesService = buildSourcesService(loadedDeps.sourcesCollection);
    loadedDeps.mappingsCollection = loadedDeps.db.collection(MAPPINGS);
    loadedDeps.mappingsService = buildMappingsService(loadedDeps.mappingsCollection);
    loadedDeps.targetsCollection = loadedDeps.db.collection(TARGETS);
    loadedDeps.targetsService = buildTargetsService(loadedDeps.targetsCollection);
    loadedDeps.responsesCollection = loadedDeps.db.collection(RESPONSES);
    loadedDeps.responsesService = buildResponsesService(loadedDeps.responsesCollection);
    loadedDeps.httpEngineService = buildHttpEngineService();
    loadedDeps.mapperService = buildMapperService(loadedDeps.mappingsService, loadedDeps.targetsService, loadedDeps.httpEngineService);
    loadedDeps.requesterService = buildRequesterService();

    return (arrayDeps = []) => {
        return arrayDeps.reduce(
            (deps, depKey) => {
                if (loadedDeps[depKey]) deps[depKey] = loadedDeps[depKey];
                return deps;
            },
            Object.create(null)
        );
    };
}

export default createDependencies;
