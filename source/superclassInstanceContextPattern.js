import { MultiplePrototypeChain } from '@dependency/multiplePrototypeChain'

/**
 * Superclass Instance Context Pattern allows creation of a context in a superclass controller, 
 * where subclasses instances can be grouped together sharing different contexts for each group. 
 * Uses `MultiplePrototypeChain` to re-wire the prototype chain of the object instance, where it will be able to create instances using the original static class prototype funcitons.
 */
export function superclassInstanceContextPattern() {
    return Class => {
        Class.createContext = function(argsObject) {
            let self = this // specific Controller that is a subclass of 'Class' (e.g. middlewareController vs ReusableController)
            let contextInstance = new self()
            
            // loop over arguments and add properties
            // contextInstance.portAppInstance // calling instance that contains the context
            contextInstance.sharedContext = {}
            if(argsObject) Object.entries(argsObject).forEach(([key, value]) => {
                contextInstance.sharedContext[key] = value
            })
            // Add cache list
            contextInstance.instance = { node: [], dataItem: [] } // caching arrays
            
            // create a new list object for proxied refrence of subclasses
            contextInstance.instanceExtendedSubclass = Object.keys(self.extendedSubclass.static)
                .reduce((object, key) => {
                    // add proxied subclass to the list
                    object[key] = MultiplePrototypeChain.newChainOnInstanceCreation({
                        Class: self.extendedSubclass.static[key],
                        contextInstance
                    })
                    return object
                }, {})
    
            return contextInstance
        }

        // return the subclass object related to this class object.
        Class.prototype.getSubclass = function({ subclassName }) {
            let contextInstance = this
            return contextInstance.instanceExtendedSubclass[subclassName]
        }

        // execute new on the subclass 
        Class.prototype.callSubclass = function(name, args) {
            let contextInstance = this
            return Reflect.construct(contextInstance.instanceExtendedSubclass[name], args)
        }

        return Class
    }
}

export function cacheInstance({ cacheArrayName, keyArgumentName = 'key' }) { // decorator + proxy
    return (target, name, descriptor) => {
        let method = target[name]
        descriptor.value = new Proxy(method, {
            apply: async (target, thisArg, argumentsList) => {
                let [{ [keyArgumentName]: key }] = argumentsList // extract key using the specified key parameter name in the method.
                let cacheArray = thisArg.instance[cacheArrayName] // Sub array of 'this.instance' in which instances are saved.
                let instance;
                if(key in cacheArray) {
                    instance = cacheArray[key]
                } else {
                    instance = await target.apply(thisArg, argumentsList)
                    cacheArray[key] = instance // add to class cache
                }
                return instance
            }          
        })
        return descriptor
    }
}
