import { getId } from '../database';
import { reThrowError } from '../utils/error-encoder';
import { ERROR_DATABASE } from '../errors';

export const buildSourcesService = (sourceCollection) => {
    const getSources = async () => {
        try {
            return await sourceCollection.find({}).toArray();
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getSourceById = async (id) => {
        try {
            return sourceCollection.findOne({_id: getId(id)});
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getSources,
        getSourceById
    };
};

export default buildSourcesService;
