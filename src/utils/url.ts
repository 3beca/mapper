import config from '../config';

const { externalHttp } = config;

function removeEndSlash(path: string) {
    if (path[path.length - 1] === '/') {
        return path.slice(0, -1);
    }
    return path;
}

export function getExternalUrl(path?: string) {
    const { protocol, host, port } = externalHttp;
    return `${protocol}://${host}${port ? ':' + port : ''}${path ? removeEndSlash(path) : ''}`;
}
