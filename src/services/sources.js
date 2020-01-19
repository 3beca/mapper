import { getId } from '../database';
import { reThrowError, throwError } from '../utils/error-encoder';
import {
    ERROR_DATABASE,
    ERROR_SOURCE_FORMAT
} from '../errors';

export const buildSourcesService = (sourcesCollection) => {
    const getSources = async () => {
        try {
            return await sourcesCollection.find({}).toArray();
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getSourceById = async (id) => {
        try {
            return sourcesCollection.findOne({_id: getId(id)});
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const insertSource = async (source) => {
        if (!source) return throwError(ERROR_SOURCE_FORMAT.type, ERROR_SOURCE_FORMAT.message);
        try {
            const { inserted } = await sourcesCollection.insertOne(source);
            return {
                _id: inserted,
                ...source
            };
        }
        catch (error) {
                return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getSources,
        getSourceById,
        insertSource
    };
};

export default buildSourcesService;
