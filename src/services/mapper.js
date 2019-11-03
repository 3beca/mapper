import { encodeError } from '../utils/error-encoder';
import { getId } from '../database';
import {
    ERROR_TRANSFORM_SOURCE
} from '../errors';
import { transformSource } from './http-engine';

export const mapper = async (sourceId, sourceRequest, sourcesCollection, mappingsCollection, targetsCollection) => {
    const source = await sourcesCollection.findOne({_id: getId(sourceId)});
    if (!source) return [];

    const requests = [];
    let errors;
    for (const {mappingId, targetId} of source.flows) {
        const mapping = await mappingsCollection.findOne({_id: getId(mappingId)}) || {};
        const target = await targetsCollection.findOne({_id: getId(targetId)});

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
                    source: sourceId,
                    mapping: mappingId,
                    target: targetId,
                    details: error.message
                }

            );
        }
    }

    return {requests, errors};
};
