import { getId } from '../database';
import { reThrowError, throwError } from '../utils/error-encoder';
import { 
    ERROR_DATABASE,
    ERROR_MAPPING_ID,
    ERROR_MAPPING_FORMAT
} from '../errors';

export const buildMappingsService = (mappingCollection) => {
    const getMappings = async () => {
        try {
            return await mappingCollection.find({}).toArray();
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getMappingById = async (id) => {
        if (!id) return null;
        try {
            return mappingCollection.findOne({_id: getId(id)});
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const insertMapping = async (mapping) => {
        if (!mapping) return throwError(ERROR_MAPPING_FORMAT.type, ERROR_MAPPING_FORMAT.message);
        try {
            const { inserted } = await mappingCollection.insertOne(mapping);
            return {
                _id: inserted,
                ...mapping
            };
        }
        catch (error) {
                return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getMappings,
        getMappingById,
        insertMapping
    };
};

export default buildMappingsService;
