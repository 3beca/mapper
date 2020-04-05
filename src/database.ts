import mongodb, { ObjectId, MongoClient, Db } from 'mongodb';

export const COLLECTION_SOURCES = 'sources';
export const COLLECTION_TARGETS = 'targets';
export const COLLECTION_MAPPINGS = 'mapping';
export const COLLECTION_RESPONSES = 'responses';

export function getId(id: string): ObjectId {
    return new ObjectId(id);
}

export function connect(uri: string): Promise<MongoClient> {
    return mongodb.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ignoreUndefined: true
    });
}

export async function getAndSetupDatabase(client: MongoClient, databaseName: string): Promise<Db> {
    const db: Db = client.db(databaseName);
    const sources = db.collection(COLLECTION_SOURCES);
    const targets = db.collection(COLLECTION_TARGETS);
    const mappings = db.collection(COLLECTION_MAPPINGS);
    const responses = db.collection(COLLECTION_RESPONSES);
    await sources.createIndex({ name: 1 }, { unique: true });
    await targets.createIndex({ name: 1 }, { unique: true });
    await mappings.createIndex({ name: 1 }, { unique: true });
    await responses.createIndex({ name: 1 }, { unique: true });
    return db;
}
