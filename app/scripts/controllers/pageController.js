'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('PageCtrl', function($routeParams, $q, eventService) {
    var self = this;
    if ($routeParams.uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = true;
        eventService.getEventById($routeParams.uri)
        .then(function(event) {
            self.event = event; 
            self.isLoadingEvent = false;

            return event.fetchRelated();
        })
        .then(function() { 
            var placeEventPromise = eventService.getEventsByPlaceId(_.pluck(self.event.places, 'id'));
            var timeEventPromise = eventService.getEventsLooselyWithinTimeSpan(self.event.start_time, self.event.end_time);
            return $q.all([placeEventPromise, timeEventPromise]);

        })
        .then(function(events) { 
            self.relatedEventsByPlace = _.filter(events[0], function(e) { return e.id !== self.event.id; });
            self.relatedEventsByTime = _.filter(events[1], function(e) { return e.id !== self.event.id; });
            self.isLoadingLinks = false;
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    }
});
