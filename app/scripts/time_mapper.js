'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Time() { }

function TimeMapper() { }

TimeMapper.prototype.makeObject = function(obj) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var o = new Time();

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });

    o.timeString = new Date(o.label).toLocaleDateString();

    return o;
};

angular.module('eventsApp')
.factory('timeMapperService', function(objectMapperService) {
    var proto = Object.getPrototypeOf(objectMapperService);
    TimeMapper.prototype = angular.extend({}, proto, TimeMapper.prototype);

    return new TimeMapper();
})
.factory('Time', function() {
    return Time;
});

