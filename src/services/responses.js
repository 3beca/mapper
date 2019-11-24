import { getId } from '../database';
import { reThrowError } from '../utils/error-encoder';
import { ERROR_DATABASE } from '../errors';

export const buildResponsesService = (responsesCollection) => {
    const getResponses = async () => {
        try {
            return await responsesCollection.find({}).toArray();
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getResponseById = async (id) => {
        try {
            return responsesCollection.findOne({_id: getId(id)});
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getResponses,
        getResponseById
    };
};

export default buildResponsesService;
