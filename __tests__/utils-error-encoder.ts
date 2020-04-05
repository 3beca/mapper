import {
    ERROR_UNKNOWN,
    ERROR_DATABASE,
    ERROR_NOTFOUND,
    encodeErrorFromErrorInfo,
    encodeErrorFromType,
    encodeErrorFromError,
    findError,
    findErrorByType,
    typeOfError,
    reThrowError,
    throwError,
    ErrorResponse,
    ErrorResponseList,
    ErrorWithType
} from '../src/errors';

describe(
    'Error encoder should',
    () => {
        it(
            'build a valid ErrorResponse from a type',
            () => {
                const noFirstError = undefined;
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        {code: ERROR_NOTFOUND.code, message: ERROR_NOTFOUND.message, meta}
                    ]
                };

                const error = encodeErrorFromType(noFirstError, ERROR_NOTFOUND.type);

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'add a ErrorResponse from type into a ErrorResponseList',
            () => {
                const errorBefore: ErrorResponse = { code: 1000, message: 'Error before', meta: {}};
                const firstError: ErrorResponseList = {errors: [errorBefore]};
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        errorBefore,
                        {code: ERROR_NOTFOUND.code, message: ERROR_NOTFOUND.message, meta}
                    ]
                };

                const error = encodeErrorFromType(firstError, ERROR_NOTFOUND.type);

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a ErrorResponse from a JS Error',
            () => {
                const invalidFirstError = null;

                const expectErrorResult = {
                    errors: [
                        {code: ERROR_NOTFOUND.code, message: ERROR_NOTFOUND.message, meta: {}}
                    ]
                };
                const error = new Error() as ErrorWithType;
                error.errorType = ERROR_NOTFOUND.type;

                const errorResponseList: ErrorResponseList = encodeErrorFromError(invalidFirstError, error);

                expect(errorResponseList).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'capture error and transform to ErrorResponseList',
            () => {
                expect.assertions(1);

                const expectedError: ErrorResponseList = {
                    errors: [
                        {code: ERROR_NOTFOUND.code, message: ERROR_NOTFOUND.message, meta: {}}
                    ]
                };

                try {
                    throwError(ERROR_NOTFOUND.type, ERROR_NOTFOUND.message);
                }
                catch (error) {
                    expect(encodeErrorFromError(null, error)).toEqual(expectedError);
                }
            }
        );

        it(
            'add a ErrorResponse from Error into a ErrorResponseList',
            () => {
                const errorBefore: ErrorResponse = { code: 1000, message: 'Error before', meta: {}};
                const firstError: ErrorResponseList = {errors: [errorBefore]};
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        errorBefore,
                        {code: ERROR_NOTFOUND.code, message: ERROR_NOTFOUND.message, meta}
                    ]
                };

                try {
                    throwError(ERROR_NOTFOUND.type, ERROR_NOTFOUND.message);
                }
                catch (error) {
                    expect(encodeErrorFromError(firstError, error)).toEqual(expectErrorResult);
                }
            }
        );

        it(
            'add a ErrorResponse from Error into a ErrorResponseList',
            () => {
                const errorBefore: ErrorResponse = { code: 1000, message: 'Error before', meta: {}};
                const firstError: ErrorResponseList = {errors: [errorBefore]};
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        errorBefore,
                        {code: ERROR_NOTFOUND.code, message: ERROR_NOTFOUND.message, meta}
                    ]
                };

                try {
                    throwError(ERROR_NOTFOUND.type, ERROR_NOTFOUND.message);
                }
                catch (error) {
                    expect(encodeErrorFromErrorInfo(firstError, ERROR_NOTFOUND)).toEqual(expectErrorResult);
                }
            }
        );

        it(
            'add a ErrorResponse from Error into a ErrorResponseList',
            () => {
                const errorBefore: ErrorResponse = { code: 1000, message: 'Error before', meta: {}};
                const firstError: ErrorResponseList = {errors: [errorBefore]};
                const meta = {metadata: true};
                const expectErrorResult = {
                    errors: [
                        errorBefore,
                        {code: ERROR_NOTFOUND.code, message: ERROR_NOTFOUND.message, meta}
                    ]
                };

                try {
                    throwError(ERROR_NOTFOUND.type, ERROR_NOTFOUND.message);
                }
                catch (error) {
                    expect(encodeErrorFromErrorInfo(firstError, ERROR_NOTFOUND, meta)).toEqual(expectErrorResult);
                }
            }
        );
    }
);

describe(
    'Error handler',
    () => {
        it(
            'typeOfError should return false if error do not have errorType',
            () => {
                expect(typeOfError(new Error(), Symbol('Typed Error'))).toBe(false);
            }
        );

        it(
            'typeOfError should return false if error do not match',
            () => {
                expect.assertions(1);
                try {
                    throwError(Symbol('Error 1'), 'error 1');
                }
                catch (error) {
                    expect(typeOfError(error, Symbol('Other Error'))).toBe(false);
                }
            }
        );

        it(
            'typeOfError should return true if same error',
            () => {
                expect.assertions(1);
                const errorType = Symbol('Error Typed');
                try {
                    throwError(errorType, 'error 1');
                }
                catch (error) {
                    expect(typeOfError(error, errorType)).toBe(true);
                }
            }
        );

        it(
            'reThrowError should throw an error with a typeError field',
            () => {
                expect.assertions(1);
                const errorType = Symbol('Error Typed');
                try {
                    reThrowError(errorType, new Error('existing error'));
                }
                catch (error) {
                    expect(typeOfError(error, errorType)).toBe(true);
                }
            }
        );

        it(
            'findErrorBy should return ERROR_DATABASE from its type',
            () => {
                const expectedError = ERROR_DATABASE;

                const error = findErrorByType(ERROR_DATABASE.type);

                expect(error).toEqual(expectedError);
            }
        );

        it(
            'findErrorByType should return UNKNOWN if no type is not known',
            () => {
                const expectedError = ERROR_UNKNOWN;

                const error = findErrorByType(Symbol());

                expect(error).toEqual(expectedError);
            }
        );

        it(
            'findError should return UNKNOWN if no errorType in Error',
            () => {
                const expectedError = ERROR_UNKNOWN;

                const error = findError(new Error());

                expect(error).toEqual(expectedError);
            }
        );

        it(
            'findError should return DATABASE_ERROR when errorType found',
            () => {
                expect.assertions(2);
                const errorType = ERROR_DATABASE.type;
                try {
                    reThrowError(errorType, new Error('existing error'));
                }
                catch (error) {
                    const errorFound = findError(error);
                    expect(errorFound).toEqual(ERROR_DATABASE);
                    expect(typeOfError(error, errorType)).toBe(true);
                }
            }
        );

        it(
            'findError should return UNKNOWN if no errorType in Error',
            () => {
                expect.assertions(2);
                const errorType = Symbol('Error Not Defined');
                try {
                    reThrowError(errorType, new Error('existing error'));
                }
                catch (error) {
                    const errorFound = findError(error);
                    expect(errorFound).toEqual(ERROR_UNKNOWN);
                    expect(typeOfError(error, errorType)).toBe(true);
                }
            }
        );
    }
);
