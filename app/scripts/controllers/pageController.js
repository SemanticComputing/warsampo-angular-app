'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('PageCtrl', function($routeParams, $q, $rootScope, eventService,
              photoService, Settings) {

    $rootScope.showHelp = null;

    var self = this;
    self.images = [];

    var fetchImages = function(event) {
        self.isLoadingImages = true;
        var photoConfig = Settings.getPhotoConfig();
        self.images = [];
        photoService.getRelatedPhotosForEvent(event, photoConfig).then(function(imgs) {
            self.images = imgs;
            self.isLoadingImages = false;
        });
    };

    self.fetchImages = function() {
        fetchImages(self.event);
    };

    Settings.setApplyFunction(self.fetchImages);

    if ($routeParams.uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = true;
        eventService.getEventById($routeParams.uri)
        .then(function(event) {
            self.event = event; 
            self.isLoadingEvent = false;

            return $q.all(event.fetchRelated(), fetchImages(event));
        })
        .then(function() { 
            var placeEventPromise = eventService.getEventsByPlaceId(_.pluck(self.event.places, 'id'));
            var timeEventPromise = eventService.getEventsLooselyWithinTimeSpan(self.event.start_time, self.event.end_time);
            return $q.all([placeEventPromise, timeEventPromise]);

        })
        .then(function(events) { 
            self.relatedEventsByPlace = _.filter(events[0], function(e) { return e.id !== self.event.id; });
            if (_.isEmpty(self.relatedEventsByPlace)) {
                self.relatedEventsByPlace = null;
            }
            self.relatedEventsByTime = _.filter(events[1], function(e) { return e.id !== self.event.id; });
            if (_.isEmpty(self.relatedEventsByTime)) {
                self.relatedEventsByTime = null;
            }
            self.isLoadingLinks = false;
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    }
});
