import mongodb, { ObjectId } from 'mongodb';

export const COLLECTION_SOURCES = 'sources';
export const COLLECTION_TARGETS = 'targets';
export const COLLECTION_MAPPINGS = 'mapping';
export const COLLECTION_RESPONSES = 'responses';

export function getId(id) {
    return new ObjectId(id);
}

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
    const responses = db.collection(COLLECTION_RESPONSES);
    await sources.createIndex({ name: 1 }, { unique: true });
    await targets.createIndex({ name: 1 }, { unique: true });
    await mappings.createIndex({ name: 1 }, { unique: true });
    await responses.createIndex({ name: 1 }, { unique: true });
    return db;
}
