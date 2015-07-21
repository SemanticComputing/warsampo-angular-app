'use strict';

/*
 * Service for transforming SPARQL result triples into more manageable objects.
 * Functionality can be modified by giving overriding functions as parameters.
 */
angular.module('eventsApp')
    .service('objectMapperService', function() {
        this.makeObject = function(obj) {
            // Flatten the obj. Discard everything except values.
            // Assume that each property of the obj has a value property with
            // the actual value.
            var o = {};

            _.forIn(obj, function(value, key) {
                o[key] = value.value;
            });

            return o;
        };

        this.mergeObjects = function(first, second) {
            // Merge two objects (triples) into one object.
            return _.merge(first, second, function(a, b) {
                if (_.isEqual(a, b)) {
                    return a;
                }
                if (_.isArray(a)) {
                    return a.concat(b);
                }
                return [a, b];
            }, this);
        };

        this.makeObjectList = function(objects) {
            // Create a list of the SPARQL results where triples with the same
            // subject are merged into one object.
            var self = this;
            var obj_list = _.transform(objects, function(result, obj) {
                obj = self.makeObject(obj);
                // Check if this object has been constructed earlier
                var old = _.find(result, function(e) {
                    return e.id === obj.id;
                });
                if (old) { 
                    // Merge this triple into the object constructed earlier
                    self.mergeObjects(old, obj);
                }
                else {
                    // This is the first triple related to the id
                    result.push(obj);
                }                
            });
            return obj_list;
        };
});
