export type ErrorInfo = {
    type: symbol,
    code: number,
    message: string,
    meta?: {}
};
export type ErrorWithType = {
    errorType?: symbol
} & Error;
export type ErrorWithStatusCode = {
    statusCode?: number
} & Error;
export type ErrorResponse = {
    code: number,
    message: string,
    meta?: {}
};
export type ErrorResponseList = {
    errors: ErrorResponse[]
} | null | undefined;

// Generic Errors
export const ERROR_UNKNOWN : ErrorInfo = {type: Symbol('ERROR_UNKNOWN'), code: 500, message: 'Unknown error'};
export const ERROR_NOTFOUND : ErrorInfo = {type: Symbol('ERROR_NOTFOUND'), code: 404, message: 'Resource not found'};

// App Errors
export const ERROR_TRANSFORM_SOURCE : ErrorInfo = {type: Symbol('ERROR_TRANSFORM_SOURCE'), code: 1001, message: 'Error transforming source'};
export const ERROR_MAPPER : ErrorInfo = {type: Symbol('ERROR_MAPPER'), code: 1002, message: 'Error mapping sourceId'};
export const ERROR_SOURCE_ID : ErrorInfo = {type: Symbol('ERROR_SOURCE_ID'), code: 1003, message: 'You must provide a sourceId'};
export const ERROR_RESPONSE_ID : ErrorInfo = {type: Symbol('ERROR_UERROR_RESPONSE_IDNKNOWN'), code: 1004, message: 'Invalid responseId'};
export const ERROR_TRANSFORM_RESPONSE : ErrorInfo = {type: Symbol('ERROR_TRANSFORM_RESPONSE'), code: 1005, message: 'Error transforming response'};
export const ERROR_MAPPING_ID : ErrorInfo = {type: Symbol('ERROR_MAPPING_ID'), code: 1006, message: 'You must provide a mappingsId'};
export const ERROR_TARGET_ID : ErrorInfo = {type: Symbol('ERROR_TARGET_ID'), code: 1007, message: 'You must provide a targetsId'};
export const ERROR_MAPPING_FORMAT : ErrorInfo = {type: Symbol('ERROR_MAPPING_FORMAT'), code: 1008, message: 'You must provide a valid mapping object'};
export const ERROR_TARGET_FORMAT : ErrorInfo = {type: Symbol('ERROR_TARGET_FORMAT'), code: 1009, message: 'You must provide a valid target object'};
export const ERROR_RESPONSE_FORMAT : ErrorInfo = {type: Symbol('ERROR_RESPONSE_FORMAT'), code: 1010, message: 'You must provide a valid response object'};
export const ERROR_SOURCE_FORMAT : ErrorInfo = {type: Symbol('ERROR_SOURCE_FORMAT'), code: 1011, message: 'You must provide a valid source object'};
export const ERROR_HEADER_FORMAT : ErrorInfo = {type: Symbol('ERROR_HEADER_FORMAT'), code: 1012, message: 'You must provide a valid header object'};

// Params Errors
export const ERROR_PARAMS_MISSING : ErrorInfo = {type: Symbol('ERROR_PARAM_MISSING'), code: 8001, message: 'You must provide all required params'};
export const ERROR_INVALID_PARAM_VALUE : ErrorInfo = {type: Symbol('ERROR_INVALID_PARAM_VALUE'), code: 8002, message: 'You must provide a valid value for the param'};

// Mongo errors
export const ERROR_DATABASE : ErrorInfo = {type: Symbol('ERROR_DATABASE'), code: 9001, message: 'Database Error'};

export const ERRORS: object = {
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
    [ERROR_INVALID_PARAM_VALUE.type]: ERROR_INVALID_PARAM_VALUE,
    [ERROR_DATABASE.type]: ERROR_DATABASE,
    [ERROR_HEADER_FORMAT.type]: ERROR_HEADER_FORMAT
};

export const findError = (error: ErrorWithType) => {
    if (!error || !error.errorType) return ERROR_UNKNOWN;
    if (ERRORS[error.errorType]) return ERRORS[error.errorType];
    return ERROR_UNKNOWN;
};

export const findErrorByType = (type: symbol) => {
    if (ERRORS[type]) return ERRORS[type];
    return ERROR_UNKNOWN;
};

export const encodeErrorFromErrorInfo = (ErrorResponseList: ErrorResponseList, errorInfo: ErrorInfo, meta: object = {}) : ErrorResponseList => {
    const {type, ...errorResponse} = errorInfo;
    if (!ErrorResponseList) {
        const extendedErrorInfo: ErrorResponse = {...errorResponse, meta: {...errorInfo.meta, ...meta}};
        return { errors: [extendedErrorInfo]};
    }
    ErrorResponseList.errors.push({...errorResponse, meta});
    return ErrorResponseList;
};

export const encodeErrorFromType = (ErrorResponseList: ErrorResponseList = {errors: []}, type: symbol, meta: object = {}): ErrorResponseList => {
    const extendedErrorInfo: ErrorInfo = findErrorByType(type);
    return encodeErrorFromErrorInfo(ErrorResponseList, extendedErrorInfo, meta);
};

export const encodeErrorFromError = (ErrorResponseList: ErrorResponseList, error: ErrorWithType, meta: object = {}) : ErrorResponseList => {
    const errorInfo : ErrorInfo = findError(error);
    return encodeErrorFromErrorInfo(ErrorResponseList, errorInfo, meta);
};

export const reThrowError = (errorType: symbol, error: ErrorWithType): never => {
    error.errorType = errorType;
    throw error;
};

export const throwError = (errorType: symbol, message: string): never => {
    const error: ErrorWithType = new Error(message);
    error.errorType = errorType;
    throw error;
};

export const typeOfError = (error: ErrorWithType, errorType: symbol) : boolean => {
    if (error.errorType === errorType) return true;
    return false;
};
