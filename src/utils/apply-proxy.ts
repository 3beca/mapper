export const applyProxy = (source: any, placeholder: any): any => new Proxy(
    source,
    {
        get: function(target, name) {
            return name in target ? target[name] : placeholder;
        }
    }
);
