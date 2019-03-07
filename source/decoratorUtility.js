export function add({ to = 'static' }, method) {
    return Class => {
        let targetReference;
        switch (to) {
            case 'prototype':
                targetReference = Class.prototype
            break;
            case 'static':
            default:
                targetReference = Class
            break;
        }
        Object.entries(method).forEach(
            ([key, value]) => targetReference[key] = value
        )
        return Class
    }
}

export function execute({ staticMethod, self = true, args = [] }) {
    // return a decorator function
    return targetClass => {
        if(self) args.unshift(targetClass) // add to beginning 
        targetClass[staticMethod](...args)
        return targetClass
    }
}

// Apply decorator only if condition is true
export function conditional({ condition = true, decorator }) {
    return (condition) ? decorator : Class => { return Class } ; 
}

/** 
 * method decorator to execute method only once on instance. caching the result of the first execution to return it on subsequent calls.
 * Tracks execution using 'executedmethod' object, which it adds to this argument.
*/
export function executeOnceForEachInstance() { // decorator + proxy
    return (target, methodName, descriptor) => {
        let method = target[methodName]
        descriptor.value = new Proxy(method, {
            apply: async (target, thisArg, argumentsList) => {
                if( thisArg.executedmethod && 
                    thisArg.executedmethod[methodName] &&
                    thisArg.executedmethod[methodName]['executed']
                ) {
                    return thisArg.executedmethod[methodName]['result']
                }
                thisArg.executedmethod = {}
                thisArg.executedmethod[methodName] = {}
                let instance = await target.apply(thisArg, argumentsList)
                thisArg.executedmethod[methodName]['executed'] = true
                thisArg.executedmethod[methodName]['result'] = instance
                return instance
            }
        })
        return descriptor
    }
}

/** 
 * method decorator to check if nestedUnit is parent or child, i.e. top level or nested levels.
 * Adds "executionLevel" property to this argument.
*/
export function executionLevel() { // decorator + proxy
    return (target, methodName, descriptor) => {
        let method = target[methodName]
        descriptor.value = new Proxy(method, {
            apply: async (target, thisArg, argumentsList) => {
                thisArg.executionLevel = (thisArg.key) ? 'nested' : 'topLevel'
                return await target.apply(thisArg, argumentsList)
            }
        })
        return descriptor
    }
}
