import type { Collection } from 'mongodb';

export const createFakeSource = async (
    sourcesCollection: Collection,
    mappingsCollection: Collection,
    targetsCollection: Collection,
    responsesCollection: Collection,
    template: string,
    headers: string,
    url = 'https://notifier.triveca.ovh/',
    method = 'POST',
    templateResponse = 'it works!',
    headersResponse = '{"Content-Type": ""}',
    statusResponse = '200',
    name = 'Test' + Date.now()
) => {
    const flow = await createFakeFlow(mappingsCollection, targetsCollection, template, headers, url, method, name);
    const responseId = await createFakeResponse(responsesCollection, templateResponse, headersResponse, statusResponse, name);
    const { insertedId: sourceInserted} = await sourcesCollection.insertOne({
        name: 'Test_Source' + name,
        flows: [flow],
        responseId
    });
    return {_id: sourceInserted + '', flows: [flow], responseId, name: 'Test_Source' + name};
};

export const createFakeFlow = async (
    mappingsCollection: Collection,
    targetsCollection: Collection,
    template: string,
    headers: string,
    url = 'https://notifier.triveca.ovh/',
    method = 'POST',
    name = '_' + Date.now()
) => {
    const mappingId = await createFakeMapping(mappingsCollection, template, name);
    const targetId = await createFakeTarget(targetsCollection, headers, url, method, name);
    return {mappingId, targetId};
};

export const createFakeMapping = async (
    mappingsCollection: Collection,
    template: string,
    name = '_' + Date.now()
) => {
    const mapping = {
        name: 'Test_Mapping' + name,
        template
    };
    const { insertedId: mappingInserted} = await mappingsCollection.insertOne(mapping);
    return mappingInserted + '';
};

export const createFakeTarget = async (
    targetsCollection: Collection,
    headers: string,
    url = 'https://notifier.triveca.ovh/',
    method = 'POST',
    name = '_' + Date.now()
) => {
    const target = {
        name: 'Test_Target' + name,
        method,
        url,
        headers
    };
    const { insertedId: targetInserted} = await targetsCollection.insertOne(target);
    return targetInserted + '';
};

export const createFakeResponse = async (
    responsesCollection: Collection,
    template: string,
    headers: string,
    status = '200',
    name = '_' + Date.now()
) => {
    const responseMapping = {
        name: 'Test_Response' + name,
        status,
        template,
        headers
    };
    const { insertedId: responseInserted} = await responsesCollection.insertOne(responseMapping);
    return responseInserted + '';
};
