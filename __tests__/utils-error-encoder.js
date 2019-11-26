import {
    encodeError,
    typeOf,
    reThrowError,
    throwError
} from '../src/utils/error-encoder';
import {
    ERROR_UNKNOWN,
    ERROR_DATABASE,
    findError
} from '../src/errors';

describe(
    'Error encoder should',
    () => {
        it(
            'build a valid error object without receiving an error',
            () => {
                const firstError = undefined;
                const code = 1001;
                const message = 'First error';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        {code, message, meta}
                    ]
                };

                const error = encodeError(firstError, code, message, meta);

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error object when receiving a valid error',
            () => {
                const errorBefore = {code: 1000, message: 'Error before', meta: {}};
                const firstError = {errors: [errorBefore]};
                const code = 1001;
                const message = 'First error';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        errorBefore,
                        {code, message, meta}
                    ]
                };

                const error = encodeError(firstError, code, message, meta);

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error object when receiving an invalid error',
            () => {
                const invalidFirstError = null;
                const code = 1001;
                const message = 'First error';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        {code, message, meta}
                    ]
                };

                const error = encodeError(invalidFirstError, code, message, meta);

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error object when receiving an string as error',
            () => {
                const invalidFirstError = 'error';
                const code = 1001;
                const message = 'First error';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        {code, message, meta}
                    ]
                };

                const error = encodeError(invalidFirstError, code, message, meta);

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error when only receive a plain error',
            () => {
                const code = 1000;
                const message = 'Generic error message';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        {code, message, meta}
                    ]
                };

                const error = encodeError({code, message, meta});

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error when only receive a code error',
            () => {
                const code = 1000;
                const message = 'Generic error message';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        {code, message, meta}
                    ]
                };

                const error = encodeError(null, code);

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error object when receiving an object with code and message',
            () => {
                const plainError = {code: 1000, message: 'Error before', meta: {}};
                const code = 1001;
                const message = 'First error';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        plainError,
                        {code, message, meta}
                    ]
                };

                const error = encodeError(plainError, code, message, meta);

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error object when receiving only a code',
            () => {
                const plainError = {code: 1000, message: 'Error before', meta: {}};
                const code = 1001;
                const message = 'Generic error message';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        plainError,
                        {code, message, meta}
                    ]
                };

                const error = encodeError(plainError, code);

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error object when receiving code and message as an object',
            () => {
                const errorBefore = {code: 1000, message: 'Error before', meta: {}};
                const firstError = {errors: [errorBefore]};
                const code = 1001;
                const message = 'Generic error message';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        errorBefore,
                        {code, message, meta}
                    ]
                };

                const error = encodeError(firstError, {code, message});

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error object when receiving only a code',
            () => {
                const errorBefore = {code: 1000, message: 'Error before', meta: {}};
                const firstError = {errors: [errorBefore]};
                const code = 1001;
                const message = 'Generic error message';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        errorBefore,
                        {code, message, meta}
                    ]
                };

                const error = encodeError(firstError, {code});

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error object when receiving only a object with code as first object',
            () => {
                const code = 1001;
                const message = 'Generic error message';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        {code, message, meta}
                    ]
                };

                const error = encodeError({code});

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );

        it(
            'build a valid error object when receiving code and message as an object and a plain error',
            () => {
                const plainError = {code: 1000, message: 'Error before', meta: {}};
                const code = 1001;
                const message = 'Generic error message';
                const meta = {};
                const expectErrorResult = {
                    errors: [
                        plainError,
                        {code, message, meta}
                    ]
                };

                const error = encodeError(plainError, {code, message});

                expect(error).toEqual(expect.objectContaining(expectErrorResult));
            }
        );
    }
);

describe(
    'Error handler',
    () => {
        it(
            'typeOf should return false if error do not have errorType',
            () => {
                expect(typeOf(new Error(), Symbol('Typed Error'))).toBe(false);
            }
        );

        it(
            'typeOf should return false if error do not match',
            () => {
                expect.assertions(1);
                try {
                    throwError(Symbol('Error 1'), 'error 1');
                }
                catch (error) {
                    expect(typeOf(error, Symbol('Other Error'))).toBe(false);
                }
            }
        );

        it(
            'typeOf should return true if same error',
            () => {
                expect.assertions(1);
                const errorType = Symbol('Error Typed');
                try {
                    throwError(errorType, 'error 1');
                }
                catch (error) {
                    expect(typeOf(error, errorType)).toBe(true);
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
                    expect(typeOf(error, errorType)).toBe(true);
                }
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
                    expect(typeOf(error, errorType)).toBe(true);
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
                    expect(typeOf(error, errorType)).toBe(true);
                }
            }
        );
    }
);
