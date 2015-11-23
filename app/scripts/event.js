'use strict';

/*
 * Services for events..
 */
angular.module('eventsApp')
    .service('eventService', function($q, eventRepository, personRepository,
                unitRepository) {
        var self = this;

        self.fetchPeople = function(event) {
            return personRepository.getByIdList(event.participant_id).then(function(people) {
                if (people) {
                    event.people = people;
                    event.hasLinks = true;
                }
                return event;
            });
        };

        self.fetchUnits = function(event) {
            return unitRepository.getByIdList(event.participant_id).then(function(units) {
                if (units) {
                    event.units = units;
                    event.hasLinks = true;
                }
                return event;
            });
        };

        self.fetchRelated = function(event) {
            var relatedFuns = [self.fetchPeople(event), self.fetchUnits(event)];
            return $q.all(relatedFuns).then(function() {
                return event;
            });
        };

        self.getEventsByTimeSpan = function(start, end) {
            // Get events that occured between the dates start and end (inclusive).
            // Returns a promise.
            return eventRepository.getByTimeSpan(start, end);
        };

        self.getAllEvents = function() {
            // Get all events.
            // Returns a promise.
            return eventRepository.getAll();
        };

        self.getEventById = function(id) {
            return eventRepository.getById(id);
        };

        self.getEventsLooselyWithinTimeSpan = function(start, end) {
            // Get events that at least partially occured between the dates start and end.
            // Returns a promise.
            return eventRepository.getLooselyWithinTimeSpan(start, end);
        };

        self.getEventsByPlaceId = function(ids) {
            return eventRepository.getByPlaceId(ids);
        };

        self.getEventsByActor = function(id) {
            return eventRepository.getByActorId(id);
        };
        
});

