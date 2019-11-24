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

// Mongo errors
export const ERROR_DATABASE = {type: Symbol('ERROR_DATABASE'), code: 9001, message: 'Database Error'};
