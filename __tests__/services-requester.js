import { requester, requesterSerial } from '../src/services/requester';
import {
    createGetRequest,
    createPostRequest,
    createPutRequest,
    createDeleteRequest
} from '../tests-utils/mock-requsts';

describe(
    'requester service should',
    () => {
        it(
            'return an empty array when requests is null',
            async () => {
                const requests = null;

                const responses = await requester(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(0);
            }
        );

        it(
            'return an empty array when no receive requests',
            async () => {
                const requests = [];

                const responses = await requester(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(0);
            }
        );

        it(
            'receive an array of one Request without method  and use GET',
            async () => {
                const req1 = createGetRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    {'Content-Type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                delete req1.method;
                const requests = [req1];


                const responses = await requester(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual({filed1: 'valuefield1'});
                expect(responses[0].response.headers).toEqual({ 'content-type': 'application/json' });
            }
        );

        it(
            'receive an array of Request, fire each request and compose all responses in a Response object',
            async () => {
                const req1 = createPostRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    JSON.stringify({senderName: 'Juanjo', temperature: 25.5}),
                    {'content-type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                const req2 = createGetRequest(
                    'https://cep.tribeca.ovh',
                    '/version',
                    undefined,
                    200,
                    JSON.stringify({filed1: 'valuefield2'}),
                    {'content-type': 'application/json'}
                );
                const requests = [req1, req2];

                const responses = await requester(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(2);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response).toEqual({
                    status: 200,
                    body: {filed1: 'valuefield1'},
                    headers: {'content-type': 'application/json'}
                });
                expect(responses[1].request).toEqual(req2);
                expect(responses[1].response).toEqual({
                    status: 200,
                    body: {filed1: 'valuefield2'},
                    headers: {'content-type': 'application/json'}
                });
            }
        );

        it(
            'receive a Request GET anf fire it',
            async () => {
                const req1 = createGetRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    {'Content-Type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                const requests = [req1];


                const responses = await requester(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual({filed1: 'valuefield1'});
                expect(responses[0].response.headers).toEqual({ 'content-type': 'application/json' });
            }
        );

        it(
            'receive a Request PUT and fire it',
            async () => {
                const req1 = createPutRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    JSON.stringify({filed: 'valuefield'}),
                    {'content-type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                const requests = [req1];


                const responses = await requester(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual({filed1: 'valuefield1'});
                expect(responses[0].response.headers).toEqual({ 'content-type': 'application/json' });
            }
        );

        it(
            'receive a Request DELETE and fire it',
            async () => {
                const req1 = createDeleteRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    JSON.stringify({filed: 'valuefield'}),
                    {'content-type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                const requests = [req1];


                const responses = await requester(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual({filed1: 'valuefield1'});
                expect(responses[0].response.headers).toEqual({ 'content-type': 'application/json' });
            }
        );

        it(
            'receive a Request POST with url-encoded body and fire it',
            async () => {
                const req1 = createPostRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    'filed1=value1&field2=value2',
                    {'Content-Type': 'application/x-www-form-urlencoded'},
                    200,
                    '<html><body><div>Hola</div></body></html>',
                    {'content-type': 'text/plain'}
                );
                const requests = [req1];


                const responses = await requester(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual('<html><body><div>Hola</div></body></html>');
                expect(responses[0].response.headers).toEqual({ 'content-type': 'text/plain' });
            }
        );
    }
);

describe(
    'requesterSerial service should',
    () => {
        it(
            'return an empty array when requests is null',
            async () => {
                const requests = null;

                const responses = await requesterSerial(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(0);
            }
        );

        it(
            'return an empty array when no receive requests',
            async () => {
                const requests = [];

                const responses = await requesterSerial(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(0);
            }
        );

        it(
            'receive an array of one Request without method  and use GET',
            async () => {
                const req1 = createGetRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    {'Content-Type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                delete req1.method;
                const requests = [req1];


                const responses = await requesterSerial(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual({filed1: 'valuefield1'});
                expect(responses[0].response.headers).toEqual({ 'content-type': 'application/json' });
            }
        );

        it(
            'receive an array of Request, fire each request and compose all responses in a Response object',
            async () => {
                const req1 = createPostRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    JSON.stringify({senderName: 'Juanjo', temperature: 25.5}),
                    {'content-type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                const req2 = createGetRequest(
                    'https://cep.tribeca.ovh',
                    '/version',
                    undefined,
                    200,
                    JSON.stringify({filed1: 'valuefield2'}),
                    {'content-type': 'application/json'}
                );
                const requests = [req1, req2];

                const responses = await requesterSerial(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(2);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response).toEqual({
                    status: 200,
                    body: {filed1: 'valuefield1'},
                    headers: {'content-type': 'application/json'}
                });
                expect(responses[1].request).toEqual(req2);
                expect(responses[1].response).toEqual({
                    status: 200,
                    body: {filed1: 'valuefield2'},
                    headers: {'content-type': 'application/json'}
                });
            }
        );

        it(
            'receive a Request GET anf fire it',
            async () => {
                const req1 = createGetRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    {'Content-Type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                const requests = [req1];


                const responses = await requesterSerial(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual({filed1: 'valuefield1'});
                expect(responses[0].response.headers).toEqual({ 'content-type': 'application/json' });
            }
        );

        it(
            'receive a Request PUT and fire it',
            async () => {
                const req1 = createPutRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    JSON.stringify({filed: 'valuefield'}),
                    {'content-type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                const requests = [req1];


                const responses = await requesterSerial(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual({filed1: 'valuefield1'});
                expect(responses[0].response.headers).toEqual({ 'content-type': 'application/json' });
            }
        );

        it(
            'receive a Request DELETE and fire it',
            async () => {
                const req1 = createDeleteRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    JSON.stringify({filed: 'valuefield'}),
                    {'content-type': 'application/json'},
                    200,
                    JSON.stringify({filed1: 'valuefield1'}),
                    {'content-type': 'application/json'}
                );
                const requests = [req1];


                const responses = await requesterSerial(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual({filed1: 'valuefield1'});
                expect(responses[0].response.headers).toEqual({ 'content-type': 'application/json' });
            }
        );

        it(
            'receive a Request POST with url-encoded body and fire it',
            async () => {
                const req1 = createPostRequest(
                    'https://notifier.tribeca.ovh',
                    '/25?date=123456789',
                    'filed1=value1&field2=value2',
                    {'Content-Type': 'application/x-www-form-urlencoded'},
                    200,
                    '<html><body><div>Hola</div></body></html>',
                    {'content-type': 'text/plain'}
                );
                const requests = [req1];


                const responses = await requesterSerial(requests);

                expect(Array.isArray(responses)).toBe(true);
                expect(responses.length).toBe(1);
                expect(responses[0].request).toEqual(req1);
                expect(responses[0].response.status).toBe(200);
                expect(responses[0].response.body).toEqual('<html><body><div>Hola</div></body></html>');
                expect(responses[0].response.headers).toEqual({ 'content-type': 'text/plain' });
            }
        );
    }
);

