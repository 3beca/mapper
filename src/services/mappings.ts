import type { Collection } from 'mongodb';
import { getId } from '../database';
import {
    ERROR_DATABASE,
    ERROR_MAPPING_FORMAT,
    reThrowError,
    throwError
} from '../errors';
export type Mapping = {
    name: string,
    description?: string,
    template: string
};
export type MappingPersisted = {
    _id: string
} & Mapping;
export type MappingsService = {
    getMappings: () => Promise<MappingPersisted[]>,
    getMappingById: (id: string) => Promise<MappingPersisted|null>,
    insertMapping: (mapping: Mapping) => Promise<MappingPersisted>
};

export const buildMappingsService = (mappingsCollection: Collection<Mapping>): MappingsService => {
    const getMappings = async (): Promise<MappingPersisted[]> => {
        try {
            return await mappingsCollection.find<MappingPersisted>({}).toArray();
        }
        catch (error) {
            return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getMappingById = async (id: string): Promise<MappingPersisted|null> => {
        if (!id) return null;
        try {
            return mappingsCollection.findOne<MappingPersisted>({_id: getId(id)});
        }
        catch (error) {
            return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const insertMapping = async (mapping: Mapping): Promise<MappingPersisted> => {
        if (!mapping) throwError(ERROR_MAPPING_FORMAT.type, ERROR_MAPPING_FORMAT.message);
        try {
            const { insertedId } = await mappingsCollection.insertOne(mapping);
            return {
                _id: insertedId + '',
                ...mapping
            };
        }
        catch (error) {
                return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getMappings,
        getMappingById,
        insertMapping
    };
};

export default buildMappingsService;
