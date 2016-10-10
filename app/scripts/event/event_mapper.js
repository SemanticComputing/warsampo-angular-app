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
            if (!_.isArray(event.places)) {
                event.places = event.places ? [event.places] : [];
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
