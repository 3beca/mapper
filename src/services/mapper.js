import { encodeError } from '../utils/error-encoder';
import {
    ERROR_TRANSFORM_SOURCE
} from '../errors';

export const buildMapperService = (mappingsService, targetsService, httpEngineService) => async (source, context) => {
    if (!source || !Array.isArray(source.flows)) return {requests: []};
    const requests = [];
    let errors;
    for (const {mappingId, targetId} of source.flows) {
        const mapping = await mappingsService.getMappingById(mappingId) || {};
        const target = await targetsService.getTargetById(targetId);

        try {
            const request = await httpEngineService.transformSource(context, mapping.template, target);
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

export default buildMapperService;
