(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Services for events.
    */
    angular.module('eventsApp')
    .service('eventService', eventService);

    /* @ngInject */
    function eventService($q, _, baseService, eventRepository, personRepository, unitRepository, placeRepository) {
        var self = this;

        self.fetchPlaces = function(event) {
            var placeUris = _(event).castArray().map('place_id').flatten().compact().uniq().value();

            return placeRepository.getById(placeUris).then(function(places) {
                return baseService.combineRelated(event, places, 'place_id', 'places');
            });
        };

        self.fetchPeople = function(event) {
            return personRepository.getByIdList(event.participant_id).then(function(people) {
                if (people && people.length) {
                    event.people = people;
                    event.hasLinks = true;
                }
                return event;
            });
        };

        self.fetchUnits = function(event) {
            return unitRepository.getByIdList(event.participant_id).then(function(units) {
                if (units && units.length) {
                    event.units = units;
                    event.hasLinks = true;
                }
                return event;
            });
        };

        self.fetchRelated = function(event) {
            var related = [
                self.fetchPeople(event),
                self.fetchUnits(event)
            ];
            return $q.all(related).then(function() {
                return event;
            });
        };

        self.getEventsByTimeSpan = function(start, end) {
            // Get events that occured between the dates start and end (inclusive).
            // Returns a promise.
            return eventRepository.getByTimeSpan(start, end).then(function(events) {
                return self.fetchPlaces(events);
            });
        };

        self.getEventById = function(id) {
            return eventRepository.getById(id).then(function(events) {
                return self.fetchPlaces(events);
            });
        };

        self.getEventsLooselyWithinTimeSpan = function(start, end) {
            // Get events that at least partially occured between the dates start and end.
            // Returns a promise.
            return eventRepository.getLooselyWithinTimeSpan(start, end);
        };

        self.getEventsLooselyWithinTimeSpanPager = function(start, end, pageSize, idFilter) {
            // Get events that at least partially occured between the dates start and end.
            // Returns a promise.
            if (idFilter) {
                return eventRepository.getLooselyWithinTimeSpanFilterById(start, end, idFilter, pageSize);
            }
            return eventRepository.getLooselyWithinTimeSpan(start, end, pageSize);
        };

        self.getEventsByPlaceId = function(ids) {
            return eventRepository.getByPlaceId(ids);
        };

        self.getEventsByPlaceIdPager = function(ids, pageSize, idFilter) {
            if (idFilter) {
                return eventRepository.getByPlaceIdFilterById(ids, idFilter, pageSize);
            }
            return eventRepository.getByPlaceId(ids, pageSize);
        };

        self.getUnitAndSubUnitEventsByUnitId = function(id) {
            return eventRepository.getUnitAndSubUnitEventsByUnitId(id);
        };
    }
})();
