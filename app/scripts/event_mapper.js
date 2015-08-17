'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function EventMapper() { }

EventMapper.prototype.makeObject = function(event) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var e = {};

    e.id = event.id.value;
    e.type = event.type ? event.type.value : '';
    e.description = event.description.value;
    e.start_time = event.start_time.value;
    e.end_time = event.end_time.value;
    e.place_label = event.place_label ? event.place_label.value : '';
    if (event.title) {
        e.title = event.title.value;
    }

    if (event.polygon) {
        // The event's location is represented as a polygon.
        // Transform the polygon string into a list consisting
        // of a single lat/lon pair object list.
        var l = event.polygon.value.split(" ");
        l = l.map(function(p) { 
            var latlon = p.split(',');
            return { lat: latlon[1], lon: latlon[0] };
        });
        e.polygons = [l];
    }
    if (event.lat && event.lon) {
        // The event's location is represented as a point.
        e.points = [{
            lat: event.lat.value,
            lon: event.lon.value
        }];
    }

    return e;
};

angular.module('eventsApp')
    .factory('eventMapperService', function(objectMapperService) {
        var proto = Object.getPrototypeOf(objectMapperService);
        EventMapper.prototype = angular.extend({}, proto, EventMapper.prototype);

        return new EventMapper();
});

