import { encodeError } from '../utils/error-encoder';
import {
    ERROR_TRANSFORM_SOURCE
} from '../errors';
import { transformSource } from './http-engine';

export const mapper = async (sourceName, sourceRequest, sourcesCollection, mappingsCollection, targetsCollection) => {
    const source = await sourcesCollection.findOne({name: sourceName});
    if (!source) return [];

    const requests = [];
    let errors;
    for (const {targetName, mappingName} of source.flows) {
        const target = await targetsCollection.findOne({name: targetName});
        const mapping = await mappingsCollection.findOne({name: mappingName}) || {};
        try {
            const request = await transformSource(sourceRequest, mapping.template, target);
            requests.push(request);
        }
        catch (error) {
            errors = encodeError(
                errors,
                ERROR_TRANSFORM_SOURCE.code,
                ERROR_TRANSFORM_SOURCE.message,
                {
                    source: sourceName,
                    mapping: mappingName,
                    target: targetName,
                    details: error.message
                }

            );
        }
    }

    return {requests, errors};
};
