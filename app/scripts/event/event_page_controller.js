(function() {
    'use strict';

    /**
    * @ngdoc function
    * @name eventsApp.controller:EventPageController
    * @description
    * # EventPageController
    * Controller of the eventsApp
    */
    angular.module('eventsApp')
    .controller('EventPageController', EventPageController);

    function EventPageController($routeParams, $q, $rootScope, $translate,
            _, eventService, photoService, Settings, EVENT_TYPES) {

        $rootScope.showHelp = null;

        var self = this;
        self.images = [];

        self.fetchImages = function() {
            fetchImages(self.event);
        };

        init();

        function init() {
            Settings.setApplyFunction(self.fetchImages);

            if (!$routeParams.uri) {
                return;
            }
            self.isLoadingEvent = true;
            self.isLoadingLinks = true;
            eventService.getEventById($routeParams.uri)
            .then(function(event) {
                self.event = event;
                return eventService.fetchRelated(self.event);
            }).then(function(event) {
                self.demoLink = getDemoLink(event);
                self.isLoadingEvent = false;

                var placeEventPromise = eventService.getEventsByPlaceIdPager(
                    _.map(self.event.places, 'id'), Settings.pageSize, self.event.id);
                var timeEventPromise = eventService.getEventsLooselyWithinTimeSpanPager(
                    self.event.start_time, self.event.end_time, Settings.pageSize, self.event.id);
                return $q.all([
                    placeEventPromise,
                    timeEventPromise,
                    fetchImages(self.event)
                ]);
            })
            .then(function(events) {
                $q.all([events[0].getTotalCount(), events[1].getTotalCount()])
                .then(function(counts) {
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

        function getDemoLink(event) {
            var base = '/' + $translate.use() + '/';
            var app, id;
            switch(event.type_id) {
                case EVENT_TYPES.BATTLE:
                case EVENT_TYPES.TROOP_MOVEMENT:
                case EVENT_TYPES.UNIT_JOINING:
                case EVENT_TYPES.UNIT_FORMATION:
                case EVENT_TYPES.UNIT_NAMING:
                    app = 'units';
                    id = ((event.units || [])[0] || {}).id;
                    break;
                case EVENT_TYPES.PROMOTION:
                case EVENT_TYPES.BIRTH:
                case EVENT_TYPES.DEATH:
                case EVENT_TYPES.DISSAPEARING:
                case EVENT_TYPES.MEDAL_ASSIGNMENT:
                    app = 'persons';
                    id = event.participant_id;
                    break;
                default:
                    id = event.id;
                    app = 'events';
            }
            var url = base + app + '?uri=' + id;
            return url;
        }

        function fetchImages(event) {
            self.isLoadingImages = true;
            var photoConfig = Settings.getPhotoConfig();
            self.images = [];
            photoService.getRelatedPhotosForEvent(event, photoConfig).then(function(imgs) {
                self.images = imgs;
                self.isLoadingImages = false;
            });
        }
    }
})();
