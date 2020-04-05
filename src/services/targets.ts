import type { Collection } from 'mongodb';
import { getId } from '../database';
import {
    ERROR_DATABASE,
    ERROR_TARGET_FORMAT,
    reThrowError,
    throwError
} from '../errors';

export type Target = {
    name: string;
    description?: string;
    method?: string;
    headers: string;
    url: string;
    encoding?: string;
};
export type TargetPersisted = {
    _id: string
} & Target;

export type TargetsService = {
    getTargets: () => Promise<TargetPersisted[]>,
    getTargetById: (id: string) => Promise<TargetPersisted|null>,
    insertTarget: (target: Target) => Promise<TargetPersisted>
};

export const buildTargetsService = (targetsCollection: Collection<Target>): TargetsService => {
    const getTargets = async (): Promise<TargetPersisted[]> => {
        try {
            return await targetsCollection.find<TargetPersisted>({}).toArray();
        }
        catch (error) {
            return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const getTargetById = async (id: string): Promise<TargetPersisted|null> => {
        try {
            return await targetsCollection.findOne<TargetPersisted>({ _id: getId(id) });
        }
        catch (error) {
            return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    const insertTarget = async (target: Target): Promise<TargetPersisted> => {
        if (!target) throwError(ERROR_TARGET_FORMAT.type, ERROR_TARGET_FORMAT.message);
        try {
            const { insertedId } = await targetsCollection.insertOne(target);
            return {
                _id: insertedId + '',
                ...target
            };
        }
        catch (error) {
                return reThrowError(ERROR_DATABASE.type, error);
        }
    };

    return {
        getTargets,
        getTargetById,
        insertTarget
    };
};

export default buildTargetsService;
