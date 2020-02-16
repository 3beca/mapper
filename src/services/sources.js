import { getId } from '../database';
import { reThrowError, throwError } from '../utils/error-encoder';
import {
    ERROR_DATABASE,
    ERROR_SOURCE_FORMAT
} from '../errors';
import { getExternalUrl } from '../utils/url';

const sourceWithUrl = (source) => source ? {...source, url: getExternalUrl('/mappers/' + source._id)} : null;

export const buildSourcesService = (sourcesCollection) => {
    const getSources = async () => {
        try {
            return (await sourcesCollection.find({}).toArray()).map(sourceWithUrl);
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getSourceById = async (id) => {
        try {
            return sourceWithUrl(await sourcesCollection.findOne({_id: getId(id)}));
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
                url: getExternalUrl('/mappers/' + source._id),
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
