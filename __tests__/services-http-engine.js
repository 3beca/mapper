import {
    transformSource
} from '../src/services/http-engine';

describe(
    'Http Engine',
    () => {
        it(
            'return a transformed request when receive a valid source, mapping and target',
            async () => {
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"title":"Bienvenido {{body.name}}","body":"La temperatura de casa es de {{body.temperature}}ºC","data":{"id":{{params.id}},"temperature":{{body.temperature}},"name":"{{body.name}}"}}'
                };
                const target = {
                    method: 'POST',
                    headers: '{"Content-Type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(source, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toEqual(JSON.stringify({
                    title: 'Bienvenido Juanjo',
                    body: 'La temperatura de casa es de 25ºC',
                    data: {
                        id: 25,
                        temperature: 25,
                        name: 'Juanjo'
                    }
                }));
                expect(request.headers).toEqual(expect.objectContaining({
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));

            }
        );

        it(
            'return a transformed request without source',
            async () => {
                const source = undefined;
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"title":"Bienvenido {{body.name}}","body":"La temperatura de casa es de {{body.temperature}}ºC","data":{"id":{{params.id}},"temperature":{{body.temperature}},"name":"{{body.name}}"}}'
                };
                const target = {
                    method: 'POST',
                    headers: '{"Content-Type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}"}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(source, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/?date=');
                expect(request.body).toEqual(JSON.stringify({
                    title: 'Bienvenido null',
                    body: 'La temperatura de casa es de nullºC',
                    data: {
                        id: null,
                        temperature: null,
                        name: 'null'
                    }
                }));
                expect(request.headers).toEqual(expect.objectContaining({
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                    'X-APPID': ''
                }));

            }
        );

        it(
            'return a response without body when mapping is undefined',
            async () => {
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const target = {
                    method: 'POST',
                    headers: '{"Content-Type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(source, undefined, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toBe(undefined);
                expect(request.headers).toEqual(expect.objectContaining({
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));

            }
        );

        it(
            'return an Error when url template has invalid format',
            async () => {
                expect.assertions(1);
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"title":"Bienvenido {{body.name}}","body":"La temperatura de casa es de {{body.temperature}}ºC","data":{"id":{{params.id}},"temperature":{{body.temperature}},"name":"{{body.name}}"}}'
                };
                const target = {
                    method: 'POST',
                    headers: '{"Content-Type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'invalidurl'
                };

                try {
                    await transformSource(source, mapping.template, target);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing url from mapping template: Invalid URL: invalidurl');
                }
            }
        );

        it(
            'return an Error when target is undefined',
            async () => {
                expect.assertions(1);
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"title":"Bienvenido {{body.name}}","body":"La temperatura de casa es de {{body.temperature}}ºC","data":{"id":{{params.id}},"temperature":{{body.temperature}},"name":"{{body.name}}"}}'
                };
                const target = undefined;

                try {
                    await transformSource(source, mapping.template, target);
                }
                catch (error) {
                    expect(error.message).toEqual('Error target not found');
                }
            }
        );

        it(
            'return an Error when body template is json with invalid format',
            async () => {
                expect.assertions(1);
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{invalidjson}'
                };
                const target = {
                    method: 'POST',
                    headers: '{"Content-Type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                try {
                    await transformSource(source, mapping.template, target);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing body from mapping template: Unexpected token i in JSON at position 1');
                }
            }
        );

        it(
            'return an Error when headers has invalid format',
            async () => {
                expect.assertions(1);
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"hello": "world"}'
                };
                const target = {
                    method: 'POST',
                    headers: '{"Content-Type": "application/json", "accept": application/json, "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                try {
                    await transformSource(source, mapping.template, target);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing target headers: Unexpected token a in JSON at position 47');
                }
            }
        );

        it(
            'return a valid response when target do not expecify method',
            async () => {
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target = {
                    headers: '{"Content-Type": "text/html", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(source, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('GET');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toEqual('<html><body><div>Hello Juanjo</div><div>Estas a 25ºC en tu casa');
                expect(request.headers).toEqual(expect.objectContaining({
                    'Content-Type': 'text/html',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));
            }
        );

        it(
            'return a valid response when template is text',
            async () => {
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target = {
                    method: 'POST',
                    headers: '{"Content-Type": "text/html", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(source, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toEqual('<html><body><div>Hello Juanjo</div><div>Estas a 25ºC en tu casa');
                expect(request.headers).toEqual(expect.objectContaining({
                    'Content-Type': 'text/html',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));
            }
        );

        it(
            'return a valid response without body when template undefined',
            async () => {
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const target = {
                    method: 'POST',
                    headers: '{"Content-Type": "text/html", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(source, undefined, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toBe(undefined);
                expect(request.headers).toEqual(expect.objectContaining({
                    'Content-Type': 'text/html',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));
            }
        );

        it(
            'return a valid response when headers is undefined',
            async () => {
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target = {
                    method: 'POST',
                    headers: undefined,
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(source, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toEqual('<html><body><div>Hello Juanjo</div><div>Estas a 25ºC en tu casa');
                expect(request.headers).toBe(undefined);
            }
        );

        it(
            'return a valid response when body is undefined',
            async () => {
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: undefined,
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target = {
                    method: 'POST',
                    headers: undefined,
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(source, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toEqual('<html><body><div>Hello null</div><div>Estas a nullºC en tu casa');
                expect(request.headers).toBe(undefined);
            }
        );

        it(
            'return an Error when headers from source do not match headers in target',
            async () => {
                expect.assertions(1);
                const source = {
                    name: 'testsource1',
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25}
                };
                const mapping = {
                    name: 'mappingtest1',
                    template: '{"hello": "world"}'
                };
                const target = {
                    method: 'POST',
                    headers: '{"Content-Type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                try {
                    await transformSource(source, mapping.template, target);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing target headers: Unexpected token } in JSON at position 95');
                }
            }
        );
    }
);
