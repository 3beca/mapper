export const getMappings = async (collection) => {
    const mappings = await collection.find({}).toArray();
    return mappings;
};
