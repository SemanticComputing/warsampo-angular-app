'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function EventMapper() {
    this.getExtremeDate = function(dates, min) {
        if (_.isArray(dates)) {
            var fun;
            if (min) {
                fun = _.min;
            } else {
                fun = _.max;
            }
            return new Date(fun(dates, function(date) {
                return new Date(date);
            }));
        }
        if (!dates) {
            return undefined;
        }
        return new Date(dates);
    };

    this.isFullYear = function(start, end) {
        return start.getDate() === 1 && start.getMonth() === 0 && end.getDate() === 31 &&
            end.getMonth() === 11;
    };

    this.formatDateRange = function(start, end) {
        if (this.isFullYear(start, end)) {
            var start_year = start.getFullYear();
            var end_year = end.getFullYear();
            return start_year === end_year ? start_year : start_year + '-' + end_year;
        }
        if (end - start) {
            return start.toLocaleDateString() + '-' + end.toLocaleDateString();
        }
        return start.toLocaleDateString();
    };

    this.formatPlace = function(place) {
        var res;
        if (_.isArray(place)) {
            res = _.pluck(place, 'label').join(", ");
        } else {
            res = place ? place.label : '';
        }

        return res;
    };

    this.createTitle = function(event) {
        var start = this.getExtremeDate(event.start_time, true);
        var end = this.getExtremeDate(event.end_time, false);
        var time = this.formatDateRange(start, end);

        //return place ? place + ' ' + time : time;
        return time;
    };
}

EventMapper.prototype.makeObject = function(event) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var e = {};

    e.hasLinks = true;

    e.id = event.id.value;
    e.type = event.type ? event.type.value : '';
    e.description = event.description.value;
    e.time_id = event.time_id.value;
    e.start_time = event.start_time.value;
    e.end_time = event.end_time.value;
    e.timeSpanString = this.createTitle(e);
    e.municipality_id = event.municipality_id ? event.municipality_id.value : '';
    e.participant_id = event.participant ? event.participant.value : '';
    if (event.title) {
        e.title = event.title.value;
    }

    if (event.place_id) {
        var place = {
            id: event.place_id.value,
            label: event.place_label ? event.place_label.value : ''
        };
        place.hipla_url = 'http://hipla.fi?uri=' + place.id;
        if (event.polygon) {
            // The event's location is represented as a polygon.
            // Transform the polygon string into a list consisting
            // of a single lat/lon pair object list.
            var l = event.polygon.value.split(" ");
            l = l.map(function(p) { 
                var latlon = p.split(',');
                return { lat: latlon[1], lon: latlon[0] };
            });
            place.polygon = l;
        }
        if (event.lat && event.lon) {
            // The event's location is represented as a point.
            place.point = {
                lat: event.lat.value,
                lon: event.lon.value
            };
        }

        e.places = [place];
    }

    return e;
};

angular.module('eventsApp')
    .factory('eventMapperService', function(objectMapperService) {
        var proto = Object.getPrototypeOf(objectMapperService);
        EventMapper.prototype = angular.extend({}, proto, EventMapper.prototype);

        return new EventMapper();
});

