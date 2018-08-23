
/**
 * @description Get subclasses constructors and add them to Class static property array (self.extendedSubclass.static[]).
 * @requires {array} this.extendedSubclass.static
 * @action adds an array element to "extendedSubclass.static" array.
 * @param  {class{}} staticSubclass
 * @usedAs class module.
 */
 export default function (staticSubclass) {
    const self = this
    if(!staticSubclass) return;
    Object.entries(staticSubclass).forEach(([key, value]) => {
        self.extendedSubclass.static[key] = value
    });
}

export let updated = function ({ keyName = null, subclass }) {
    const self = this
    if(!keyName) return;
    self.extendedSubclass.static[keyName] = subclass
}

