import { getId } from '../database';
import { reThrowError, throwError } from '../utils/error-encoder';
import {
    ERROR_DATABASE,
    ERROR_TARGET_FORMAT
} from '../errors';

export const buildTargetsService = (targetsCollection) => {
    const getTargets = async () => {
        try {
            return await targetsCollection.find({}).toArray();
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getTargetById = async (id) => {
        try {
            return targetsCollection.findOne({_id: getId(id)});
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const insertTarget = async (target) => {
        if (!target) return throwError(ERROR_TARGET_FORMAT.type, ERROR_TARGET_FORMAT.message);
        try {
            const { inserted } = await targetsCollection.insertOne(target);
            return {
                _id: inserted,
                ...target
            };
        }
        catch (error) {
                return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getTargets,
        getTargetById,
        insertTarget
    };
};

export default buildTargetsService;
