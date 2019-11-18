// Generic Errors
export const ERROR_UNKNOWN = {code: 500, message: 'Unknown error'};
export const ERROR_NOTFOUND = {code: 404, message: 'Resource not found'};

// App Errors
export const ERROR_TRANSFORM_SOURCE = {code: 1001, message: 'Error transforming source'};
export const ERROR_MAPPER = {code: 1002, message: 'Error mapping sourceId'};
export const ERROR_SOURCE_ID = {code: 1003, message: 'You must provide a sourceId'};
export const ERROR_RESPONSE_ID = {code: 1004, message: 'Invalid responseId'};
export const ERROR_TRANSFORM_RESPONSE = {code: 1005, message: 'Error transforming response'};

// Mongo errors
export const ERROR_DATABASE = {code: 9001, message: 'Database Error'};
