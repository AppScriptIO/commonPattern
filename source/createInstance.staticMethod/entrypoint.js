import { usingGenericInstance as populateInstancePropertyFromJson } from '@dependency/populateObjectPropertyFromObject'

/**
 * Create unit instance, query data, and populate json data to instance.
 * @param  {array} controllerInstanceArray
 * @param  {string} dataKey
 * @param  {function} getDocumentQueryCallback
 * @return {instance} class instance
 */
export default async function (controllerInstanceArray, dataKey, getDocumentQueryCallback) {
    let Class = this
    
    // [1] Create new instance 
    let instance;
    if(!(dataKey in controllerInstanceArray)) {
        instance = await new Class(dataKey)
        controllerInstanceArray[dataKey] = instance
    } else {
        instance = controllerInstanceArray[dataKey] // Preserved between requests. Causes problems
    }

    // [2] Populate properties.
    if(!('jsonData' in instance)) { // if not already populated with data.
        let jsonData = await getDocumentQueryCallback(Class.rethinkdbConnection, dataKey)
        await populateInstancePropertyFromJson({ object: instance, jsonData })
    }

    return instance // return the newly cr
}
