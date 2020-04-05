import type { Collection } from 'mongodb';
import { getId } from '../database';
import {
    ERROR_DATABASE,
    ERROR_RESPONSE_FORMAT,
    reThrowError,
    throwError
} from '../errors';
export type Response = {
    name: string,
    description?: string,
    status?: string,
    template?: string,
    headers?: string
};
export type ResponsePersisted = {
    _id: string
} & Response;
export type ResponsesService = {
    getResponses: () => Promise<ResponsePersisted[]>,
    getResponseById: (id: string) => Promise<ResponsePersisted|null>,
    insertResponse: (response: Response) => Promise<ResponsePersisted>
};

export const buildResponsesService = (responsesCollection: Collection<Response>): ResponsesService => {
    const getResponses = async (): Promise<ResponsePersisted[]> => {
        try {
            return await responsesCollection.find<ResponsePersisted>({}).toArray();
        }
        catch (error) {
            return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getResponseById = async (id: string): Promise<ResponsePersisted|null> => {
        try {
            return responsesCollection.findOne<ResponsePersisted>({_id: getId(id)});
        }
        catch (error) {
            return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const insertResponse = async (response: Response): Promise<ResponsePersisted> => {
        if (!response) throwError(ERROR_RESPONSE_FORMAT.type, ERROR_RESPONSE_FORMAT.message);
        try {
            const { insertedId } = await responsesCollection.insertOne(response);
            return {
                _id: insertedId + '',
                ...response
            };
        }
        catch (error) {
                return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getResponses,
        getResponseById,
        insertResponse
    };
};

export default buildResponsesService;
