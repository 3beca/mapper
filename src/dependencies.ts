import config from './config';
import {
    connect,
    getAndSetupDatabase,
    COLLECTION_SOURCES,
    COLLECTION_MAPPINGS,
    COLLECTION_TARGETS,
    COLLECTION_RESPONSES
} from './database';
import { buildSourcesService, SourcesService } from './services/sources';
import { buildMappingsService, MappingsService } from './services/mappings';
import { buildTargetsService, TargetsService } from './services/targets';
import { buildResponsesService, ResponsesService } from './services/responses';
import { buildMapperService, MapperService } from './services/mapper';
import { buildRequesterService, RequesterService } from './services/requester';
import { buildHttpEngineService, HttpEngineService } from './services/http-engine';
import type { MongoClient, Db, Collection } from 'mongodb';

export type DependenciesConfig = {
    DBNAME?: string;
    SOURCES?: string;
    MAPPINGS?: string;
    TARGETS?: string;
    RESPONSES?: string;
};

export type DependenciesArray = DependenciesName[];
export type Dependencies = {
    config: DependenciesConfig;
    dbClient: MongoClient;
    db: Db;
    sourcesCollection: Collection;
    sourcesService: SourcesService;
    mappingsCollection: Collection;
    mappingsService: MappingsService;
    targetsCollection: Collection;
    targetsService: TargetsService;
    responsesCollection: Collection;
    responsesService: ResponsesService;
    mapperService: MapperService;
    httpEngineService: HttpEngineService;
    requesterService: RequesterService;
};
export type DependenciesName = keyof Dependencies;
export type DependenciesLoader = (deps?: DependenciesArray) => Dependencies;
export async function createDependencies(
    {
        DBNAME,
        SOURCES = COLLECTION_SOURCES,
        MAPPINGS = COLLECTION_MAPPINGS,
        TARGETS = COLLECTION_TARGETS,
        RESPONSES = COLLECTION_RESPONSES
    }: DependenciesConfig = {}
): Promise<DependenciesLoader> {
    const { url, databaseName } = config.mongodb;
    const loadedDeps = Object.create(null) as Dependencies;
    loadedDeps.config = {
        DBNAME: DBNAME || databaseName,
        SOURCES: SOURCES,
        MAPPINGS: MAPPINGS,
        TARGETS: TARGETS,
        RESPONSES: RESPONSES
    };
    loadedDeps.dbClient = await connect(url);
    loadedDeps.db = await getAndSetupDatabase(loadedDeps.dbClient, loadedDeps.config.DBNAME || 'tribeca-mapper');
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

    return (arrayDeps: DependenciesArray = []): Dependencies => {
        return arrayDeps.reduce(
            (deps, depKey: DependenciesName) => {
                if (loadedDeps[depKey]) return {...deps, [depKey]: loadedDeps[depKey]};
                return deps;
            },
            {} as Dependencies
        );
    };
}

export default createDependencies;
