import createDependencies from '../src/dependencies';

export const EMPTY_OBJECT = Object.create(null);
export const fakeDeps = (deps = {}) => () => deps;
export const overridedDeps = (deps, overrideDeps = {}) => {
    return (depsKeys = []) => {
        const finaldeps = deps(depsKeys);
        return {...finaldeps, ...overrideDeps};
    };
};
