'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:EventPageCtrl
 * @description
 * # EventPageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('EventPageCtrl', function($routeParams, $q, $rootScope, _, eventService,
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

            var placeEventPromise = eventService.getEventsByPlaceIdPager(
                _.pluck(self.event.places, 'id'), Settings.pageSize, self.event.id);
            var timeEventPromise = eventService.getEventsLooselyWithinTimeSpanPager(
                self.event.start_time, self.event.end_time, Settings.pageSize, self.event.id);
            return $q.all([
                placeEventPromise,
                timeEventPromise,
                eventService.fetchRelated(self.event),
                fetchImages(self.event)
            ]);
        })
        .then(function(events) {
            $q.all([events[0].getTotalCount(), events[1].getTotalCount()]).then(function(counts) {
                if (counts[0] || counts[1]) {
                    self.event.hasLinks = true;
                }
                self.relatedEventsByPlace = events[0];
                self.relatedEventsByTime = events[1];
                self.isLoadingLinks = false;
            });
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    }
});
