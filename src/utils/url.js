import config from '../config';

const { externalHttp } = config;

function removeEndSlash(path) {
    if (path[path.length - 1] === '/') {
        return path.slice(0, -1);
    }
    return path;
}

export function getExternalUrl(path) {
    const { protocol, host, port } = externalHttp;
    return `${protocol}://${host}${port ? ':' + port : ''}${path ? removeEndSlash(path) : ''}`;
}