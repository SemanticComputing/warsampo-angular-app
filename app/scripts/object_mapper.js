'use strict';

/*
 * Service for transforming SPARQL result triples into more manageable objects.
 * Functionality can be modified by giving overriding functions as parameters.
 */
angular.module('eventsApp')
    .service('ObjectMapper', function() {
        var makeObject = function(obj) {
            // Flatten the obj. Discard everything except values.
            // Assume that each property of the obj has a value property with
            // the actual value.
            var o = {};

            _.forIn(obj, function(value, key) {
                o[key] = value.value;
            });

            return o;
        };

        var mergeObjects = function(first, second) {
            // Merge two objects (triples) into one object.
            return _.merge(first, second, function(a, b) {
                if (_.isEqual(a, b)) {
                    return a;
                }
                if (_.isArray(a)) {
                    return a.concat(b);
                }
                return [a, b];
            });
        };

        var makeObjectList = function(objects, makeObject, mergeObjects) {
            // Create a list of the SPARQL results where triples with the same
            // subject are merged into one object.
            var obj_list = _.transform(objects, function(result, obj) {
                obj = makeObject(obj);
                // Check if this object has been constructed earlier
                var old = _.find(result, function(e) {
                    return e.id === obj.id;
                });
                if (old) { 
                    // Merge this triple into the object constructed earlier
                    mergeObjects(old, obj);
                }
                else {
                    // This is the first triple related to the id
                    result.push(obj);
                }                
            });
            return obj_list;
        };

        return function(overrides) {
            overrides = overrides || {};
            var make = overrides.makeObject || makeObject;
            var merge = overrides.mergeObjects || mergeObjects;
            var makeList = overrides.makeObjectList || makeObjectList;

            return {
                makeObject: make,
                mergeObjects: merge,
                makeObjectList: function(objects) { 
                    return makeList(objects, make, merge);
                }
            };
        };
});
