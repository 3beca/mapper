import {
    ERROR_TRANSFORM_SOURCE,
    encodeErrorFromType
} from '../errors';
import type { ErrorResponseList } from '../errors';
import type { SourcePersisted } from './sources';
import type { TargetsService } from './targets';
import type { MappingsService } from './mappings';
import type { HttpEngineService, SourceTransformed, ContextRequest } from './http-engine';

export type MapperResponse = {
    requests: SourceTransformed[];
    errors: ErrorResponseList;
};
export type MapperService = {
    (source: SourcePersisted|undefined, context: ContextRequest): Promise<MapperResponse>;
};

export const buildMapperService = (mappingsService: MappingsService, targetsService: TargetsService, httpEngineService: HttpEngineService): MapperService => async (source: SourcePersisted|undefined, context: ContextRequest) => {
    if (!source || !Array.isArray(source.flows)) return {requests: [], errors: null};
    const requests: SourceTransformed[] = [];
    let errors: ErrorResponseList;
    for (const {mappingId, targetId} of source.flows) {
        const mapping = await mappingsService.getMappingById(mappingId);
        const target = await targetsService.getTargetById(targetId);

        try {
            const request = await httpEngineService.transformSource(context, mapping && mapping.template, target);
            requests.push(request);
        }
        catch (error) {
            errors = encodeErrorFromType(
                errors,
                ERROR_TRANSFORM_SOURCE.type,
                {
                    source: source._id,
                    mapping: mappingId,
                    target: targetId,
                    details: error.message
                }

            );
        }
    }
    return {requests, errors: errors};
};

export default buildMapperService;
