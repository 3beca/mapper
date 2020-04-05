import type { DependenciesLoader, DependenciesArray, Dependencies } from '../src/dependencies';

export const EMPTY_OBJECT = Object.create(null);
export const fakeDeps = (deps = {}) : DependenciesLoader => () => deps as Dependencies;
export const overridedDeps = (deps: DependenciesLoader, overrideDeps = {}): DependenciesLoader => {
    return (depsKeys: DependenciesArray = []) => {
        const finaldeps = deps(depsKeys);
        return {...finaldeps, ...overrideDeps};
    };
};
