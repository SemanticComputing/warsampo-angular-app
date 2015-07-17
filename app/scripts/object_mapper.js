'use strict';

/*
 * Service for transforming SPARQL results into more manageable objects.
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
            var event_list = _.transform(objects, function(result, event) {
                event = makeObject(event);
                // Check if this object has been constructed earlier
                var old = _.find(result, function(e) {
                    return e.id === event.id;
                });
                if (old) { 
                    // Merge this triple into the object constructed earlier
                    mergeObjects(old, event);
                }
                else {
                    // This is the first triple related to the id
                    result.push(event);
                }                
            });
            return event_list;
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
