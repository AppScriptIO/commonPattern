/**
 * Create subclasses instances from paths array and add to Class static property array.
 * 
 * 
 * @deprecated
 */
export default function createSubclassInstance() {
    let self = this.constructor
    let subclassAsInstancePath = self.subclassPath.asInstance
    subclassAsInstancePath.forEach((subclassPath) => {
        let subclass = require(subclassPath).default
        self.extendedSubclass.instance[subclass.name] = new subclass()
    }, this)
}
