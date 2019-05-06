// const EventEmitter = require('events')
import EventEmitter from 'promise-events' // executes listeners with promise.all, allowing for await on event emittion.


/**
 * Extended Subclass Pattern saves a reference of subclasses in superclass using a key-reference object.
 * This allows calling subclasses from superclass controllers.
 */

// Mutation observer on array for debugging purposes.
// self.extendedSubclass.static = new Proxy(self.extendedSubclass.static, {
//     set: function(target, property, value, receiver) {      
//         target[property] = value;
//         console.log(self.extendedSubclass.static)
//       return true;
//     }
// })

function Superclass() {
    return Class => {
        
        // eventEmitter
        Class.eventEmitter = (new EventEmitter()).setMaxListeners(200) // increase maximum eventliseners (default = 10) // i.e. new EventEmitter()
        
        // add static list for subclasses references
        Class.extendedSubclass = { static: {} }

        // Function to be called from subclasses to invoke superclass and add them to the list.
        Class.addSubclass = function({ keyName, Subclass = this } = {}) {
            if(!keyName) keyName = Subclass.name
            Class.eventEmitter.on('addSubclass', () => {
                Class.extendedSubclass.static[keyName] = Subclass
            })
        }

        // create instance from subclass
        Class.callSubclass = (name, args) => {
            return Reflect.construct(Class.extendedSubclass.static[name], args)
        }

        // return the subclass object related to this class object.
        Class.getSubclass = function({ subclassName }) {
            return Class.extendedSubclass.static[subclassName]
        }
        
        return Class
    }
}

function Subclass() {
    return Class => {
        let Super = Object.getPrototypeOf(Class.prototype).constructor
        Super.addSubclass.call(Class)
        return Class
    }
}

export let extendedSubclassPattern = {
    Superclass, 
    Subclass
}