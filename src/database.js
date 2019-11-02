import mongodb from 'mongodb';

export const COLLECTION_SOURCES = 'sources';
export const COLLECTION_TARGETS = 'targets';
export const COLLECTION_MAPPINGS = 'mapping';

export function connect(uri) {
    return mongodb.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ignoreUndefined: true
    });
}

export async function getAndSetupDatabase(client, databaseName) {
    const db = client.db(databaseName);
    const sources = db.collection(COLLECTION_SOURCES);
    const targets = db.collection(COLLECTION_TARGETS);
    const mappings = db.collection(COLLECTION_MAPPINGS);
    await sources.createIndex({ name: 1 }, { unique: true });
    await targets.createIndex({ name: 1 }, { unique: true });
    await mappings.createIndex({ name: 1 }, { unique: true });
    return db;
}
