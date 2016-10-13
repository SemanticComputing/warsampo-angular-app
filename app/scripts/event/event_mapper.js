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

        function reviseObject(event, orig) {
            event = translateableObjectMapperService.reviseObject(event, orig);
            if (event.start_time) {
                event.timeSpanString = dateUtilService.formatExtremeDateRange(event.start_time, event.end_time);
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
