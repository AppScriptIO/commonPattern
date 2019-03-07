import { MultiplePrototypeChain } from '@dependency/multiplePrototypeChain'

/**
 * Superclass Instance Context Pattern allows creation of a context in a superclass controller, 
 * where subclasses instances can be grouped together sharing different contexts for each group. 
 * Uses `MultiplePrototypeChain` to re-wire the prototype chain of the object instance, where it will be able to create instances using the original static class prototype funcitons.
 */
export function createContextClass({ Superclass }) {
    // NOTE: This is the same thing as using a client interface to wrap instance creation, the difference is that in case of using this implementation
    // the client interface has many responsibilities, among them are: 
    // - creation of context instance and its responsibilities like caching.
    // - holding the setting for instance construction i.e. when called it constructs the main instance with the context instance in its chain.
    class Context extends Superclass {
        // property on instance
        contextInstance; // allow to reference `this` contextInstance from inheriting object. // add contextInstance getter - allows node instances created by the controller instance to call the controller it is related to.
        instanceExtendedSubclass; // proxied refrence of subclasses
        instance = { node: [], dataItem: [] } // Add cache list - caching arrays
        sharedContext = {}
        // portAppInstance // calling instance that contains the context [Previously used with old nestedUnitController]

        constructor({ contextParameter }) {
            super()
            this.contextInstance = this 

            // loop over arguments and add properties
            if(contextParameter) Object.assign(this.sharedContext, contextParameter)

            // create a new list object for proxied refrence of subclasses
            this.instanceExtendedSubclass = Object.keys(Superclass.extendedSubclass.static)
                .reduce((accumulator, key) => {
                    // add proxied subclass to the list
                    accumulator[key] = MultiplePrototypeChain.newChainOnInstanceCreation({ // push contextInstance to the prototype chain before the shared prototype of subclass and contextInstance.__proto__
                        Class: Superclass.extendedSubclass.static[key],
                        contextInstance: this
                    })
                    return accumulator
                }, {})
        }
    }
    return Context
}

export function superclassInstanceContextPattern() {
    return Class => {
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

        let proxiedClass = new Proxy(Class, {
            // instead of create context
            construct: function(target /* the Constructor reference used in proxy */, argumentsList, proxiedTarget) {
                let self = target // specific Controller that is a subclass of 'Class' (e.g. middlewareController vs ReusableController)
            
                const Context = createContextClass({ Superclass: Class })
                let contextInstance = new Context({ contextParameter: argumentsList })
                return contextInstance    
            }
        })            

        return proxiedClass
    }
}

/**
 * This plugin decorator requires `instance = { node: [], dataItem: [] }` to be present on delegated prototype (`createContextClass` decorator adds one). 
 */
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
