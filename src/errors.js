// Generic Errors
export const ERROR_UNKNOWN = {type: Symbol('ERROR_UNKNOWN'), code: 500, message: 'Unknown error'};
export const ERROR_NOTFOUND = {type: Symbol('ERROR_NOTFOUND'), code: 404, message: 'Resource not found'};

// App Errors
export const ERROR_TRANSFORM_SOURCE = {type: Symbol('ERROR_TRANSFORM_SOURCE'), code: 1001, message: 'Error transforming source'};
export const ERROR_MAPPER = {type: Symbol('ERROR_MAPPER'), code: 1002, message: 'Error mapping sourceId'};
export const ERROR_SOURCE_ID = {type: Symbol('ERROR_SOURCE_ID'), code: 1003, message: 'You must provide a sourceId'};
export const ERROR_RESPONSE_ID = {type: Symbol('ERROR_UERROR_RESPONSE_IDNKNOWN'), code: 1004, message: 'Invalid responseId'};
export const ERROR_TRANSFORM_RESPONSE = {type: Symbol('ERROR_TRANSFORM_RESPONSE'), code: 1005, message: 'Error transforming response'};
export const ERROR_MAPPING_ID = {type: Symbol('ERROR_MAPPING_ID'), code: 1006, message: 'You must provide a mappingsId'};
export const ERROR_TARGET_ID = {type: Symbol('ERROR_TARGET_ID'), code: 1007, message: 'You must provide a targetsId'};
export const ERROR_MAPPING_FORMAT = {type: Symbol('ERROR_MAPPING_FORMAT'), code: 1008, message: 'You must provide a valid mapping object'};
export const ERROR_TARGET_FORMAT = {type: Symbol('ERROR_TARGET_FORMAT'), code: 1009, message: 'You must provide a valid target object'};
export const ERROR_RESPONSE_FORMAT = {type: Symbol('ERROR_RESPONSE_FORMAT'), code: 1010, message: 'You must provide a valid response object'};
export const ERROR_SOURCE_FORMAT = {type: Symbol('ERROR_SOURCE_FORMAT'), code: 1011, message: 'You must provide a valid source object'};
export const ERROR_HEADER_FORMAT = {type: Symbol('ERROR_HEADER_FORMAT'), code: 1012, message: 'You must provide a valid header object'};

// Params Errors
export const ERROR_PARAMS_MISSING = {type: Symbol('ERROR_PARAM_MISSING'), code: 8001, message: 'You must provide all required params'};
export const ERROR_INVALID_PARAM_VALUE = {type: Symbol('ERROR_INVALID_PARAM_VALUE'), code: 8002, message: 'You must provide a valid value for the param'};

// Mongo errors
export const ERROR_DATABASE = {type: Symbol('ERROR_DATABASE'), code: 9001, message: 'Database Error'};

const ERRORS = {
    [ERROR_UNKNOWN.type]: ERROR_UNKNOWN,
    [ERROR_NOTFOUND.type]: ERROR_NOTFOUND,
    [ERROR_TRANSFORM_SOURCE.type]: ERROR_TRANSFORM_SOURCE,
    [ERROR_MAPPER.type]: ERROR_MAPPER,
    [ERROR_SOURCE_ID.type]: ERROR_SOURCE_ID,
    [ERROR_RESPONSE_ID.type]: ERROR_RESPONSE_ID,
    [ERROR_TRANSFORM_RESPONSE.type]: ERROR_TRANSFORM_RESPONSE,
    [ERROR_MAPPING_ID.type]: ERROR_MAPPING_ID,
    [ERROR_TARGET_ID.type]: ERROR_TARGET_ID,
    [ERROR_MAPPING_FORMAT.type]: ERROR_MAPPING_FORMAT,
    [ERROR_TARGET_FORMAT.type]: ERROR_TARGET_FORMAT,
    [ERROR_RESPONSE_FORMAT.type]: ERROR_RESPONSE_FORMAT,
    [ERROR_SOURCE_FORMAT.type]: ERROR_SOURCE_FORMAT,
    [ERROR_PARAMS_MISSING.type]: ERROR_PARAMS_MISSING,
    [ERROR_INVALID_PARAM_VALUE]: ERROR_INVALID_PARAM_VALUE,
    [ERROR_DATABASE.type]: ERROR_DATABASE,
    [ERROR_HEADER_FORMAT.type]: ERROR_HEADER_FORMAT
};

export const findError = (error) => {
    if (!error || !error.errorType) return ERROR_UNKNOWN;
    if (ERRORS[error.errorType]) return ERRORS[error.errorType];
    return ERROR_UNKNOWN;
};
