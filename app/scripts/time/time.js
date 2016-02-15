'use strict';

/*
 * Service that provides an interface for fetching times from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
.service('timeService', function($q, SparqlService, timeRepository,
            eventRepository, photoRepository, personRepository, Settings) {

    var self = this;

    self.fetchEvents = function(time) {
        return eventRepository.getLooselyWithinTimeSpan(time.bob, time.eoe)
            .then(function(events) {
                time.events = events;
                if (events && events.length) {
                    time.hasLinks = true;
                }
                return time;
            });
    };

    self.fetchPhotos = function(time) {
        return photoRepository.getByTimeSpan(time.bob, time.eoe, 50)
            .then(function(photos) {
                time.photos = photos;
                if (photos && photos.length) {
                    time.hasLinks = true;
                }
                return time;
            });
    };

    self.fetchCasualties = function(time) {
        return personRepository.getCasualtiesByTimeSpan(time.bob, time.eoe, Settings.pageSize)
            .then(function(data) {
                time.casualties = data;
                data.getTotalCount().then(function(count) {
                    if (count) {
                        time.hasLinks = true;
                    }
                });
                return time;
            });
    };

    self.fetchRelated = function(time) {
        var related = [
            self.fetchEvents(time),
            self.fetchPhotos(time),
            self.fetchCasualties(time)
        ];
        return $q.all(related).then(function() {
            return time;
        });
    };

    self.getAll = function() {
        // Get all times.
        // Returns a promise.
        return timeRepository.getAll();
    };

    this.getById = function(id) {
        return timeRepository.getById(id);
    };
});

