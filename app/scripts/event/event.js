(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Services for events.
    */
    angular.module('eventsApp')
    .service('eventService', eventService);

    /* @ngInject */
    function eventService($q, _, baseService, eventRepository, personRepository,
            unitRepository, placeRepository, photoRepository) {
        var self = this;

        self.fetchPlaces = fetchPlaces;
        self.fetchPeople = fetchPeople;
        self.fetchUnits = fetchUnits;
        self.fetchPhotos = fetchPhotos;
        self.fetchRelated = fetchRelated;

        self.getEventById = getEventById;
        self.getEventsByTimeSpan = getEventsByTimeSpan;
        self.getEventsLooselyWithinTimeSpan = getEventsLooselyWithinTimeSpan;
        self.getEventsLooselyWithinTimeSpanPager = getEventsLooselyWithinTimeSpanPager;
        self.getEventsByPlaceId = getEventsByPlaceId;
        self.getEventsByPlaceIdPager = getEventsByPlaceIdPager;
        self.getUnitAndSubUnitEventsByUnitId = getUnitAndSubUnitEventsByUnitId;
        self.getEventsByActorId = getEventsByActorId;

        function fetchPlaces(event) {
            return baseService.getRelated(event, 'place_id', 'places', placeRepository);
        }

        function fetchPeople(event) {
            return personRepository.getByIdList(event.participant_id).then(function(people) {
                if (people && people.length) {
                    event.people = people;
                    event.hasLinks = true;
                }
                return event;
            });
        }

        function fetchUnits(event) {
            return unitRepository.getByIdList(event.participant_id).then(function(units) {
                if (units && units.length) {
                    event.units = units;
                    event.hasLinks = true;
                }
                return event;
            });
        }

        function fetchPhotos(event) {
            return photoRepository.getByIdList(event.photo_id).then(function(photos) {
                if (photos && photos.length) {
                    event.photos = photos;
                    event.hasLinks = true;
                }
                return event;
            });
        }

        function fetchRelated(event) {
            var related = [
                self.fetchPeople(event),
                self.fetchUnits(event),
                self.fetchPhotos(event)
            ];
            return $q.all(related).then(function() {
                return event;
            });
        }

        function getEventsByTimeSpan(start, end) {
            // Get events that occured between the dates start and end (inclusive).
            // Returns a promise.
            return eventRepository.getByTimeSpan(start, end).then(function(events) {
                return self.fetchPlaces(events);
            });
        }

        function getEventById(id) {
            return eventRepository.getById(id).then(function(event) {
                if (event.length) {
                    return self.fetchPlaces(event[0]);
                }
                return $q.reject('Does not exist');
            });
        }

        function getEventsLooselyWithinTimeSpan(start, end) {
            // Get events that at least partially occured between the dates start and end.
            // Returns a promise.
            return eventRepository.getLooselyWithinTimeSpan(start, end);
        }

        function getEventsLooselyWithinTimeSpanPager(start, end, options) {
            // Get events that at least partially occured between the dates start and end.
            // Returns a promise.
            options = options || {};
            if (options.idFilter) {
                return eventRepository.getLooselyWithinTimeSpanFilterById(
                    start, end, options.idFilter, options);
            }
            return eventRepository.getLooselyWithinTimeSpan(start, end, options);
        }

        function getEventsByActorId(id, options) {
            return eventRepository.getByActorId(id, options);
        }

        function getEventsByPlaceId(ids) {
            return eventRepository.getByPlaceId(ids);
        }

        function getEventsByPlaceIdPager(ids, options) {
            if (options.idFilter) {
                return eventRepository.getByPlaceIdFilterById(ids, options.idFilter, options);
            }
            return eventRepository.getByPlaceId(ids, options);
        }

        function getUnitAndSubUnitEventsByUnitId(id) {
            return eventRepository.getUnitAndSubUnitEventsByUnitId(id).then(function(events) {
                return self.fetchPlaces(events);
            });
        }
    }
})();
