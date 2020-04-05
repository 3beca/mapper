import type { Collection } from 'mongodb';
import { getId } from '../database';
import {
    ERROR_DATABASE,
    ERROR_SOURCE_FORMAT,
    reThrowError,
    throwError
} from '../errors';
import { getExternalUrl } from '../utils/url';

export type Flow = {mappingId: string, targetId: string};
export type Source = {
    name: string,
    description?: string,
    flows?: Flow[],
    responseId?: string,
    serial?: boolean
};
export type SourcePersisted = {
    _id: string,
    url: string,
} & Source;

export type SourcesService = {
    getSources: () => Promise<SourcePersisted[]>,
    getSourceById: (id: string|undefined|null) => Promise<SourcePersisted|null>,
    insertSource: (source: Source) => Promise<SourcePersisted>
};

const sourceWithUrl = (source: SourcePersisted): SourcePersisted => ({...source, url: getExternalUrl('/mappers/' + source._id)});

export const buildSourcesService = (sourcesCollection: Collection<Source>): SourcesService => {
    const getSources = async (): Promise<SourcePersisted[]> => {
        try {
            return (await sourcesCollection.find<SourcePersisted>({}).toArray()).map(sourceWithUrl);
        }
        catch (error) {
            return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getSourceById = async (id: string|null|undefined): Promise<SourcePersisted|null> => {
        try {
            if (!id) return null;
            const source = await sourcesCollection.findOne<SourcePersisted>({_id: getId(id)});
            if (source) return sourceWithUrl(source);
            return null;
        }
        catch (error) {
            return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const insertSource = async (source: Source): Promise<SourcePersisted> => {
        if (!source) throwError(ERROR_SOURCE_FORMAT.type, ERROR_SOURCE_FORMAT.message);
        try {
            const { insertedId } = await sourcesCollection.insertOne(source);
            return {
                _id: insertedId + '',
                url: getExternalUrl('/mappers/' + insertedId),
                ...source
            };
        }
        catch (error) {
                return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getSources,
        getSourceById,
        insertSource
    };
};

export default buildSourcesService;
