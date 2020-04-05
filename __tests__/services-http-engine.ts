import {
    transformSource,
    transformResponse,
    checkHeaders,
    checkTemplate,
    ContextRequest
} from '../src/services/http-engine';
import {
    ERROR_MAPPING_FORMAT,
    ERROR_HEADER_FORMAT,
    typeOfError
} from '../src/errors';
import type { Target } from '../src/services/targets';
import type { Mapping } from '../src/services/mappings';
import type { Response } from '../src/services/responses';

describe(
    'Http Engine transformSource',
    () => {
        it(
            'return a transformed request when receive a valid source, mapping and target',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '{"title":"Bienvenido {{body.name}}","body":"La temperatura de casa es de {{body.temperature}}ºC","data":{"id":{{params.id}},"temperature":{{body.temperature}},"name":"{{body.name}}"}}'
                };
                const target: Target = {
                    name: 'target-name-transformesource-test',
                    method: 'POST',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(context, mapping.template, target);

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
                    'content-type': 'application/json',
                    'accept': 'application/json',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));

            }
        );

        it(
            'return a transformed request when receive a valid source, mapping and target with binary format',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '{"title":"Bienvenido {{body.name}}","body":"La temperatura de casa es de {{body.temperature}}ºC","data":{"id":{{params.id}},"temperature":{{body.temperature}},"name":"{{body.name}}"}}'
                };
                const target: Target = {
                    name: 'targettestbinaryformat',
                    method: 'POST',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}',
                    encoding: 'binary'
                };

                const request = await transformSource(context, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toEqual(Buffer.from(JSON.stringify({
                    title: 'Bienvenido Juanjo',
                    body: 'La temperatura de casa es de 25ºC',
                    data: {
                        id: 25,
                        temperature: 25,
                        name: 'Juanjo'
                    }
                })));
                expect(request.headers).toEqual(expect.objectContaining({
                    'content-type': 'application/json',
                    'accept': 'application/json',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));

            }
        );

        it(
            'return a transformed request without context',
            async () => {
                const context = undefined as unknown as ContextRequest;
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '{"title":"Bienvenido {{body.name}}","body":"La temperatura de casa es de {{body.temperature}}ºC","data":{"id":{{params.id}},"temperature":{{body.temperature}},"name":"{{body.name}}"}}'
                };
                const target: Target = {
                    name: 'target-test-without-context',
                    method: 'POST',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}"}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(context, mapping.template, target);

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
                    'content-type': 'application/json',
                    'accept': 'application/json',
                    'X-APPID': ''
                }));

            }
        );

        it(
            'return a response without body when mapping is undefined',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const target: Target = {
                    name: 'target-test-mapping-undefined',
                    method: 'POST',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(context, undefined, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toBe(undefined);
                expect(request.headers).toEqual(expect.objectContaining({
                    'content-type': 'application/json',
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
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '{"title":"Bienvenido {{body.name}}","body":"La temperatura de casa es de {{body.temperature}}ºC","data":{"id":{{params.id}},"temperature":{{body.temperature}},"name":"{{body.name}}"}}'
                };
                const target: Target = {
                    name: 'target-test-invalid-format',
                    method: 'POST',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'invalidurl'
                };

                try {
                    await transformSource(context, mapping.template, target);
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
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '{"title":"Bienvenido {{body.name}}","body":"La temperatura de casa es de {{body.temperature}}ºC","data":{"id":{{params.id}},"temperature":{{body.temperature}},"name":"{{body.name}}"}}'
                };
                const target = undefined;

                try {
                    await transformSource(context, mapping.template, target);
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
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '{invalidjson}'
                };
                const target: Target = {
                    name: 'target-test-httpengine',
                    method: 'POST',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                try {
                    await transformSource(context, mapping.template, target);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing body from mapping template: Unexpected token i in JSON at position 1, body: {invalidjson}');
                }
            }
        );

        it(
            'return an Error when headers has invalid format',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '{"hello": "world"}'
                };
                const target: Target = {
                    name: 'target-test-httpengine',
                    method: 'POST',
                    headers: '{"content-type": "application/json", "accept": application/json, "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                try {
                    await transformSource(context, mapping.template, target);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing target headers: Unexpected token a in JSON at position 47');
                }
            }
        );

        it(
            'return a valid response when target do not expecify method',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target: Target = {
                    name: 'target-test-httpengine',
                    headers: '{"content-type": "text/html", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(context, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('GET');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toEqual('<html><body><div>Hello Juanjo</div><div>Estas a 25ºC en tu casa');
                expect(request.headers).toEqual(expect.objectContaining({
                    'content-type': 'text/html',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));
            }
        );

        it(
            'return a valid response when template is text',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target: Target = {
                    name: 'target-test-httpengine',
                    method: 'POST',
                    headers: '{"content-type": "text/html", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(context, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toEqual('<html><body><div>Hello Juanjo</div><div>Estas a 25ºC en tu casa');
                expect(request.headers).toEqual(expect.objectContaining({
                    'content-type': 'text/html',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));
            }
        );

        it(
            'return a valid response without body when template undefined',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const target: Target = {
                    name: 'target-test-httpengine',
                    method: 'POST',
                    headers: '{"content-type": "text/html", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(context, undefined, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toBe(undefined);
                expect(request.headers).toEqual(expect.objectContaining({
                    'content-type': 'text/html',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));
            }
        );

        it(
            'return a valid response when headers is undefined',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target: Target = {
                    name: 'target-test-httpengine',
                    method: 'POST',
                    headers: undefined as unknown as string,
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(context, mapping.template, target);

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
                const context: ContextRequest = {
                    params: {id: 25},
                    body: undefined,
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };
                const target: Target = {
                    name: 'target-test-httpengine',
                    method: 'POST',
                    headers: undefined as unknown as string,
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                const request = await transformSource(context, mapping.template, target);

                expect(request).not.toBe(null);
                expect(request.method).toBe('POST');
                expect(request.url).toEqual('https://notifier.triveca.ovh/25?date=123456789');
                expect(request.body).toEqual('<html><body><div>Hello null</div><div>Estas a nullºC en tu casa');
                expect(request.headers).toBe(undefined);
            }
        );

        it(
            'return an Error when headers from target do not find headers from context',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25}
                };
                const mapping: Mapping = {
                    name: 'mappingtest1',
                    template: '{"hello": "world"}'
                };
                const target: Target = {
                    name: 'target-test-httpengine',
                    method: 'POST',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}',
                    url: 'https://notifier.triveca.ovh/{{params.id}}?date={{headers.timestamp}}'
                };

                try {
                    await transformSource(context, mapping.template, target);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing target headers: Unexpected token } in JSON at position 95');
                }
            }
        );
    }
);

describe(
    'Http Engine transformResponse',
    () => {
        it(
            'return an Error when response is undefined',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response = undefined as unknown as Response;

                try {
                    await transformResponse(context, response);
                }
                catch (error) {
                    expect(error.message).toEqual('Error invalid response');
                }
            }
        );

        it(
            'return an Error when response is invalid object',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response = 'invalidmapping' as unknown as Response;

                try {
                    await transformResponse(context, response);
                }
                catch (error) {
                    expect(error.message).toEqual('Error invalid response');
                }
            }
        );

        it(
            'return an Error when fails to parse status not numeric',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'responsetest1',
                    status: 'shouldmaptoanumber',
                    template: '{id:{{params.id}}, temperature: {{params.temperature}}}',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}'
                };

                try {
                    await transformResponse(context, response);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing status from mapping template: status shouldmaptoanumber cannot be transformed to a valid status');
                }
            }
        );

        it(
            'return an Error when fails to parse status not valid as status',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'responsetest1',
                    status: '{{params.id}}',
                    template: '{id:{{params.id}}, temperature: {{params.temperature}}}',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}'
                };

                try {
                    await transformResponse(context, response);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing status from mapping template: status 25 cannot be transformed to a valid status');
                }
            }
        );

        it(
            'return an Error when fails to parse headers',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'responsetest1',
                    status: '200',
                    template: '{id:{{params.id}}, temperature: {{params.temperature}}}',
                    headers: '{"content-type": "application/json" "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}'
                };

                try {
                    await transformResponse(context, response);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing response headers: Unexpected string in JSON at position 36');
                }
            }
        );

        it(
            'return an Error when fails to parse template',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    params: {id: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'responsetest1',
                    status: '200',
                    template: '{id:{{params.id}} temperature: {{params.temperature}}}',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}'
                };

                try {
                    await transformResponse(context, response);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing body from response template: Unexpected token i in JSON at position 1, body: {id:25 temperature: null}');
                }
            }
        );

        it(
            'return an Error when status is undefined',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'responsetest1',
                    template: '{id:{{params.id}} temperature: {{params.temperature}}}',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}'
                };

                try {
                    await transformResponse(context, response);
                }
                catch (error) {
                    expect(error.message).toEqual('Error parsing status from mapping template: status undefined cannot be transformed to a valid status');
                }
            }
        );

        it(
            'return an Empty headers when no headers',
            async () => {
                const context: ContextRequest = {
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'responsetest1',
                    status: '200',
                    template: '{id:{{params.id}}, temperature: {{params.temperature}}}',
                };

                const transformedResponse = await transformResponse(context, response);

                expect(transformedResponse).not.toBe(null);
                expect(transformedResponse.status).toBe(200);
                expect(transformedResponse.headers).toEqual(undefined);
            }
        );

        it(
            'return an Empty body when no template',
            async () => {
                const context: ContextRequest = {
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'responsetest1',
                    status: '200',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}'
                };

                const transformedResponse = await transformResponse(context, response);

                expect(transformedResponse).not.toBe(null);
                expect(transformedResponse.status).toBe(200);
                expect(transformedResponse.body).toEqual(undefined);
                expect(transformedResponse.headers).toEqual(expect.objectContaining({
                    'content-type': 'application/json',
                    'accept': 'application/json',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));
            }
        );

        it(
            'return a transformed response when receive a valid mapping',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 5},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'responsetest1',
                    status: '200',
                    template: '{"id":{{params.id}}, "temperature": {{body.temperature}}, "sensor": "{{body.name}}"}',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": {{headers.timestamp}}}'
                };

                const transformedResponse = await transformResponse(context, response);

                expect(transformedResponse).not.toBe(null);
                expect(transformedResponse.status).toBe(200);
                expect(transformedResponse.body).toEqual({id: 25, temperature: 5, sensor: 'Juanjo'});
                expect(transformedResponse.headers).toEqual(expect.objectContaining({
                    'content-type': 'application/json',
                    'accept': 'application/json',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));

            }
        );

        it(
            'return a transformed response without context',
            async () => {
                const context: ContextRequest = undefined as unknown as ContextRequest;
                const response: Response = {
                    name: 'responsetest1',
                    status: '200',
                    template: '{"id":{{params.id}}, "temperature": {{params.temperature}}}',
                    headers: '{"content-type": "application/json", "accept": "application/json", "X-APPID": "{{headers[\'X-APPID\']}}"}'
                };

                const transformedResponse = await transformResponse(context, response);

                expect(transformedResponse).not.toBe(null);
                expect(transformedResponse.status).toBe(200);
                expect(transformedResponse.body).toEqual({id: null, temperature: null});
                expect(transformedResponse.headers).toEqual(expect.objectContaining({
                    'content-type': 'application/json',
                    'accept': 'application/json',
                    'X-APPID': ''
                }));

            }
        );

        it(
            'return a valid response when template is text',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'mappingtest1',
                    status: '200',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa',
                    headers: '{"content-type": "text/html", "X-APPID": "{{headers[\'X-APPID\']}}", "timestamp": 123456789}'
                };

                const transformedResponse = await transformResponse(context, response);

                expect(transformedResponse).not.toBe(null);
                expect(transformedResponse.status).toBe(200);
                expect(transformedResponse.body).toEqual('<html><body><div>Hello Juanjo</div><div>Estas a 25ºC en tu casa');
                expect(transformedResponse.headers).toEqual(expect.objectContaining({
                    'content-type': 'text/html',
                    'X-APPID': 'tribeca',
                    timestamp: 123456789
                }));
            }
        );

        it(
            'return a valid response when body is undefined',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: undefined,
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const response: Response = {
                    name: 'mappingtest1',
                    status: '200',
                    template: '<html><body><div>Hello {{body.name}}</div><div>Estas a {{body.temperature}}ºC en tu casa'
                };

                const transformedResponse = await transformResponse(context, response);

                expect(transformedResponse).not.toBe(null);
                expect(transformedResponse.status).toBe(200);
                expect(transformedResponse.body).toEqual('<html><body><div>Hello null</div><div>Estas a nullºC en tu casa');
                expect(transformedResponse.headers).toBe(undefined);
            }
        );

        it(
            'return a valid response using responses from context',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: undefined,
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'},
                    responses: [
                        {
                            request: {
                                method: 'POST',
                                url: 'https://notifier.triveca.ovh/',
                                body: 'v1=anyvalue&v2=othervalue'
                            },
                            response: {
                                body: {
                                    code: 200,
                                    message: 'request saved'
                                },
                                headers: {
                                    'content-type': 'application/json'
                                },
                                status: 200
                            }
                        }
                    ]
                };
                const response: Response = {
                    name: 'mappingtest1',
                    status: '200',
                    template: '<html><body><div>Response {{responses[0].response.body.code}}</div><div>Message {{responses[0].response.body.message}}</div></body></html>'
                };

                const transformedResponse = await transformResponse(context, response);

                expect(transformedResponse).not.toBe(null);
                expect(transformedResponse.status).toBe(200);
                expect(transformedResponse.body).toEqual('<html><body><div>Response 200</div><div>Message request saved</div></body></html>');
                expect(transformedResponse.headers).toBe(undefined);
            }
        );
    }
);

describe(
    'checkTemplate should',
    () => {
        it(
            'return an Error when template is not a valid json',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const template = '';

                try {
                    await checkTemplate(context, template, true);
                }
                catch (error) {
                    expect(typeOfError(error, ERROR_MAPPING_FORMAT.type)).toBe(true);
                }
            }
        );

        it(
            'return a json object when receive a valid template',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const template = '{"appId": "{{headers["X-APPID"]}}"}';

                const header = await checkTemplate(context, template, true);

                expect(header).toEqual('{"appId": "tribeca"}');
            }
        );
    }
);

describe(
    'checkHeaders should',
    () => {
        it(
            'return an Error when headers is not a valid json',
            async () => {
                expect.assertions(1);
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const template = '';

                try {
                    await checkHeaders(context, template);
                }
                catch (error) {
                    expect(typeOfError(error, ERROR_HEADER_FORMAT.type)).toBe(true);
                }
            }
        );

        it(
            'return a headers object when receive a valid tempalte',
            async () => {
                const context: ContextRequest = {
                    params: {id: 25},
                    body: {name: 'Juanjo', temperature: 25},
                    headers: {timestamp: 123456789, 'X-APPID': 'tribeca'}
                };
                const template = '{"appId": "{{headers["X-APPID"]}}"}';

                const header = await checkHeaders(context, template);

                expect(header).toEqual('{"appId": "tribeca"}');
            }
        );
    }
);
