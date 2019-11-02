export const applyProxy = (source, placeholder) => new Proxy(
    source,
    {
        get: function(target, name) {
            return name in target ? target[name] : placeholder;
        }
    }
);
