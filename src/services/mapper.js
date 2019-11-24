import { encodeError } from '../utils/error-encoder';
import { getId } from '../database';
import {
    ERROR_TRANSFORM_SOURCE
} from '../errors';
import { transformSource } from './http-engine';

export const mapper = async (source, context, mappingsService, targetsService) => {
    if (!source) return {requests: []};
    const requests = [];
    let errors;
    for (const {mappingId, targetId} of source.flows) {
        const mapping = await mappingsService.getMappingById(mappingId) || {};
        const target = await targetsService.getTargetById(targetId);

        try {
            const request = await transformSource(context, mapping.template, target);
            requests.push(request);
        }
        catch (error) {
            errors = encodeError(
                errors,
                ERROR_TRANSFORM_SOURCE.code,
                ERROR_TRANSFORM_SOURCE.message,
                {
                    source: source._id,
                    mapping: mappingId,
                    target: targetId,
                    details: error.message
                }

            );
        }
    }
    return {requests, errors};
};
