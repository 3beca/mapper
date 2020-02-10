export const createFakeSource = async (
    sourcesCollection,
    mappingsCollection,
    targetsCollection,
    responsesCollection,
    template,
    headers,
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
    return {_id: sourceInserted, flow, responseId, name: 'Test_Source' + name};
};

export const createFakeFlow = async (
    mappingsCollection,
    targetsCollection,
    template,
    headers,
    url = 'https://notifier.triveca.ovh/',
    method = 'POST',
    name = '_' + Date.now()
) => {
    const mappingId = await createFakeMapping(mappingsCollection, template, name);
    const targetId = await createFakeTarget(targetsCollection, headers, url, method, name);
    return {mappingId, targetId};
};

export const createFakeMapping = async (
    mappingsCollection,
    template,
    name = '_' + Date.now()
) => {
    const mapping = {
        name: 'Test_Mapping' + name,
        template
    };
    const { insertedId: mappingInserted} = await mappingsCollection.insertOne(mapping);
    return mappingInserted;
};

export const createFakeTarget = async (
    targetsCollection,
    headers,
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
    return targetInserted;
};

export const createFakeResponse = async (
    responsesCollection,
    template,
    headers,
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
    return responseInserted;
};
