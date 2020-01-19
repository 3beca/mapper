import { getId } from '../database';
import { reThrowError, throwError } from '../utils/error-encoder';
import {
    ERROR_DATABASE,
    ERROR_RESPONSE_FORMAT
} from '../errors';

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

    const insertResponse = async (response) => {
        if (!response) return throwError(ERROR_RESPONSE_FORMAT.type, ERROR_RESPONSE_FORMAT.message);
        try {
            const { inserted } = await responsesCollection.insertOne(response);
            return {
                _id: inserted,
                ...response
            };
        }
        catch (error) {
                return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getResponses,
        getResponseById,
        insertResponse
    };
};

export default buildResponsesService;
