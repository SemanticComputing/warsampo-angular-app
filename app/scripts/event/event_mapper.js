(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('eventMapperService', eventMapperService)
    .factory('Event', Event);

    /* @ngInject */
    function eventMapperService(translateableObjectMapperService, dateUtilService, Event) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        EventMapper.prototype.reviseObject = reviseObject;
        EventMapper.prototype.objectClass = Event;

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
    function Event(TranslateableObject, _) {
        Object.defineProperty(Event.prototype, 'verboseLabel', { get: getVerboseLabel });

        Event.prototype = angular.extend(Event.prototype, TranslateableObject.prototype);

        return Event;

        function Event() { }

        function getVerboseLabel() {
            var place = this.places ? _.map(_.castArray(this.places), 'label').join(', ') + ' ' : '';
            var time = this.timeSpanString ? this.timeSpanString + ' ' : '';
            return time + place + this.type + ': ' + this.label;
        }
    }
})();
