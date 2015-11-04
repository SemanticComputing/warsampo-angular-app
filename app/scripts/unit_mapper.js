'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Unit() { }

function UnitMapper() { }

UnitMapper.prototype.makeObject = function(obj) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var o = new Unit();

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });

    return o;
};

angular.module('eventsApp')
.factory('unitMapperService', function(objectMapperService) {
    var proto = Object.getPrototypeOf(objectMapperService);
    UnitMapper.prototype = angular.extend({}, proto, UnitMapper.prototype);

    return new UnitMapper();
})
.factory('Unit', function() {
    return Unit;
});

