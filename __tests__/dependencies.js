import { createDependencies } from '../src/dependencies';
describe(
    'createdependencies should',
    () => {
        it(
            'receive no params and return an object with dependencies',
            async () => {

                const dependencies = await createDependencies();

                const deps = dependencies(['dbClient', 'db', 'sourcesService', 'mappingsService', 'targetsService', 'responsesService', 'mapperService']);

                expect(deps).toEqual({
                    dbClient: expect.any(Object),
                    db: expect.any(Object),
                    sourcesService: expect.any(Object),
                    mappingsService: expect.any(Object),
                    targetsService: expect.any(Object),
                    responsesService: expect.any(Object),
                    mapperService: expect.any(Function)
                });
                const depsDb = dependencies(['dbClient']);
                await depsDb.dbClient.close();
            }
        );

        it(
            'receive custom params and return an object with dependencies',
            async () => {
                const dependencies = await createDependencies(
                    {
                        DBNAME: 'CUSTOM_DBNAME',
                        SOURCES: 'CUSTOM_SOURCES_COLLECTION'
                    }
                );

                const deps = dependencies(['dbClient', 'db', 'sourcesService', 'mappingsService', 'targetsService', 'responsesService']);

                expect(deps).toEqual({
                    dbClient: expect.any(Object),
                    db: expect.any(Object),
                    sourcesService: expect.any(Object),
                    mappingsService: expect.any(Object),
                    targetsService: expect.any(Object),
                    responsesService: expect.any(Object)
                });
                const depsDb = dependencies(['dbClient']);
                await depsDb.dbClient.close();
            }
        );

        it(
            'receive no params and return an object with no dependencies',
            async () => {
                const dependencies = await createDependencies(
                    {
                        DBNAME: 'CUSTOM_DBNAME',
                        SOURCES: 'CUSTOM_SOURCES_COLLECTION'
                    }
                );

                const deps = dependencies();

                expect(deps).toEqual({});
                const depsDb = dependencies(['dbClient']);
                await depsDb.dbClient.close();
            }
        );

        it(
            'receive no params and return an object with no dependencies when dependency not loaded',
            async () => {
                const dependencies = await createDependencies(
                    {
                        DBNAME: 'CUSTOM_DBNAME',
                        SOURCES: 'CUSTOM_SOURCES_COLLECTION'
                    }
                );

                const deps = dependencies(['notloadeddependency']);

                expect(deps).toEqual({});
                const depsDb = dependencies(['dbClient']);
                await depsDb.dbClient.close();
            }
        );
    }
);
