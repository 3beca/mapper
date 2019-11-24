import { getId } from '../database';
import { reThrowError } from '../utils/error-encoder';
import { ERROR_DATABASE } from '../errors';

export const buildTargetsService = (targetCollection) => {
    const getTargets = async () => {
        try {
            return await targetCollection.find({}).toArray();
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getTargetById = async (id) => {
        try {
            return targetCollection.findOne({_id: getId(id)});
        }
        catch (error) {
            return void reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getTargets,
        getTargetById
    };
};

export default buildTargetsService;
