export const encodeError = (error = {errors: []}, code, message = 'Generic error message', meta = {}) => {
    const newError = error && typeof error === 'object' ? error : {};
    const errors = newError.errors && Array.isArray(newError.errors) ? newError.errors : [];
    if (newError.code) {
        const plainError = {code: newError.code, message: newError.message || 'Generic error message', meta: newError.meta || {}};
        errors.push(plainError);
    }
    if (typeof code === 'object' && code.code) {
        const objectError = {code: code.code, message: code.message || 'Generic error message', meta: code.meta || {}};
        errors.push(objectError);
    }
    else if (code){
        errors.push({code, message, meta});
    }

    return {errors};
};

export const reThrowError = (errorType, error) => {
    error.errorType = errorType;
    throw error;
};

export const throwError = (errorType, message) => {
    const error = new Error(message);
    error.errorType = errorType;
    throw error;
};

export const typeOf = (error, errorType) => {
    if (error.errorType === errorType) return true;
    return false;
};
