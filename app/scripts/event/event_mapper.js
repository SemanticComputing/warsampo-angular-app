(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('eventMapperService', eventMapperService)
    .factory('Event', Event);

    /* @ngInject */
    function eventMapperService(_, translateableObjectMapperService, dateUtilService, defaultLocale, Event) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        EventMapper.prototype.reviseObject = reviseObject;
        EventMapper.prototype.objectClass = Event;
        EventMapper.prototype.defaultLocale = defaultLocale;

        EventMapper.prototype = angular.extend({}, proto, EventMapper.prototype);

        return new EventMapper();

        function EventMapper() { }

        function reviseObject(event) {
            if (event.start_time) {
                event.timeSpanString = dateUtilService.formatExtremeDateRange(event.start_time, event.end_time);
            }
            if (event.polygon) {
                // The event's location is represented as a polygon.
                // Transform the polygon string into a list consisting
                // of a single lat/lon pair object list.
                var l = event.polygon.split(' ');
                l = l.map(function(p) {
                    var latlon = p.split(',');
                    return { lat: latlon[1], lon: latlon[0] };
                });
                _.set(event, 'place.polygon', l);
            }
            if (!_.isArray(event.places)) {
                event.places = [event.places];
            }
            return event;
        }
    }

    /* @ngInject */
    function Event($translate, TranslateableObject) {
        Event.prototype = TranslateableObject.prototype;

        return Event;

        function Event() { }
    }
})();
