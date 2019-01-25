/**
 * Create a proxy handler object with all traps reflected to an input target object.
 */
export function createProxyHandlerReflectedToTargetObject({ 
    target, // target object to reflect all traps to.
    trapHandler = {}, // object of proxy traps
    // list of all proxy traps methods available for non-constructor objects.
    nonConstructorTrapNameList = ['get', 'set', 'deleteProperty', 'enumerate', 'ownKeys', 'has', 'defineProperty', 'getOwnPropertyDescriptor', 'getPrototypeOf', 'setPrototypeOf', 'isExtensible', 'preventExtensions'],
    // list of additional traps for constructor objects
    constructorTrapNameList = ['construct', 'apply']
}) {
    let trapNameList;

    // Pick relevant trap names depending on object type (constructor i.e. function or non constructor objects)
    if(typeof target == 'function') {
        trapNameList = nonConstructorTrapNameList.concat(constructorTrapNameList)
    } else {
        trapNameList = nonConstructorTrapNameList
    }

    trapHandler = trapNameList.reduce((accumulator, trapName) => {
        // trap method reflected to target object. When called it will pass the arguments to target Object equivalent operation.
        accumulator[trapName] = function(originalTarger, ...args) {
            return Reflect[trapName](target, ...args)
        }
        return accumulator
    }, trapHandler);
    return trapHandler
}

/*
 * Ensures that constructor proxy traps comply with spec. Where it adds required values for constructor proxy targets as specified in spec. Fixes issue of creating non costructor object traps for a constructor proxy target.
 * IMPORTANT: Creating a proxy of a function with traps targeting objects must return 'arguments' as property when 'ownKeys' trap is called as is degined in the spec https://stackoverflow.com/questions/39811021/typeerror-ownkeys-on-proxy-trap-result-did-not-include-arguments/42876020
 * While using arrow functions for bypassing the requirement for 'arguments' to be present, it will fail in instantiation of new instance (arrow functions do not have 'this', and thus cannot be used as constructors) 
 */
export function addRequiredPropertyForConstructorProxy({ 
    proxyHandler, 
    constructor = new Function() // the proxied constructor or by default use a dummy function to mimic a constructor behavior.
}) {
    function ensurePropertyExistFor_ownKeysTrap({ targetTrap }) {
        return (...args) => {
            let array = targetTrap(...args)
            if(!array.includes('arguments')) array.push('arguments')
            if(!array.includes('prototype')) array.push('prototype')
            return array
        }
    }
    function ensurePropertyExistFor_getOwnPropertyDescriptorTrap({ targetTrap }) {
        return (...args) => {
            let property = args[1]
            let object = targetTrap(...args)
            if(!object) {
                if(property == 'constructor') { 
                    object = Object.getOwnPropertyDescriptor(constructor, 'constructor')
                }
                if(property == 'prototype') { 
                    object = Object.getOwnPropertyDescriptor(constructor, 'prototype')
                }
            }
            return object
        }
    }
    if(proxyHandler['ownKeys']) proxyHandler['ownKeys'] = ensurePropertyExistFor_ownKeysTrap({ targetTrap: proxyHandler['ownKeys'] })
    if(proxyHandler['getOwnPropertyDescriptor']) proxyHandler['getOwnPropertyDescriptor'] = ensurePropertyExistFor_getOwnPropertyDescriptorTrap({ targetTrap: proxyHandler['getOwnPropertyDescriptor'] })
    return proxyHandler
}