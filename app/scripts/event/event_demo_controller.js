(function() {

    'use strict';

    angular.module('eventsApp')
    .controller('EventDemoCtrl', EventDemoController);

    /* @ngInject */
    function EventDemoController($routeParams, $location, $scope, $q, $translate,
                _, Settings, WAR_INFO, eventService, photoService, casualtyRepository,
                googleMapsService, EventDemoService) {

        /* Private vars */

        var self = this;
        var eventDemoService = new EventDemoService(infoWindowCallback);

        /* Public vars */

        // The currently selected event
        self.current;
        // Images related to currently selected event
        self.images;
        // The title for the info view
        self.title;

        self.showCasualtyStats = false;

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;

        /* Activate */

        init();

        /* Implementation */

        function getCasualtyCount() {
            return eventDemoService.getCasualtyCount();
        }

        function getCasualtyStats() {
            return eventDemoService.getCasualtyStats();
        }

        function getMinVisibleDate() {
            return eventDemoService.getMinVisibleDate();
        }

        function getMaxVisibleDate() {
            return eventDemoService.getMaxVisibleDate();
        }

        function init() {
            Settings.setHelpFunction(showHelp);
            Settings.enableSettings();
            Settings.setApplyFunction(visualize);
            Settings.setHeatmapUpdater(eventDemoService.updateHeatmap);

            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
            });

            return visualize();
        }

        function visualize() {
            self.current = null;
            self.isLoadingTimemap = true;
            var era = $routeParams.era;
            var event_uri = $routeParams.uri;
            var promise;
            if (event_uri) {
                // Single event given as parameter
                promise = eventService.getEventById(event_uri).then(function(e) {
                    if (e) {
                        return createTimeMapForEvent(e);
                    } else {
                        $location.url($location.path());
                        return showWinterWar();
                    }

                });
            } else if (era) {
                // Only war given
                switch(era.toLowerCase()) {
                    case 'winterwar': {
                        promise = showWinterWar();
                        break;
                    }
                    case 'continuationwar': {
                        promise = self.showContinuationWar();
                        break;
                    }
                }
            } else {
                // No war or event specified -- redirect to Winter War
                $location.path(getWinterWarUrl()).replace();
                return $q.when();
            }

            return promise.then(function() {
                self.isLoadingTimemap = false;
            }).catch(function(data) {
                self.isLoadingTimemap = false;
                self.err = data;
            });
        }

        function showWinterWar() {
            self.title = 'EVENT_DEMO.WINTER_WAR_EVENT_TITLE';
            return eventDemoService.createTimemap(WAR_INFO.winterWarTimeSpan.start,
                    WAR_INFO.winterWarTimeSpan.end,
                    WAR_INFO.winterWarHighlights);
        }

        function showContinuationWar() {
            self.title = 'EVENT_DEMO.CONTINUATION_WAR_EVENT_TITLE';
            return eventDemoService.createTimemap(WAR_INFO.continuationWarTimeSpan.start,
                    WAR_INFO.continuationWarTimeSpan.end,
                    WAR_INFO.continuationWarHighlights);
        }

        function showHelp() {
            self.current = undefined;
        }

        function getCreateFunction(start, end) {
            if (start >= new Date(WAR_INFO.winterWarTimeSpan.start) &&
                    end <= new Date(WAR_INFO.winterWarTimeSpan.end)) {
                return showWinterWar;
            } else {
                return showContinuationWar;
            }
        }

        function createTimeMapForEvent(e) {
            if (!(e.start_time && e.end_time)) {
                return showWinterWar();
            }
            var show = getCreateFunction(new Date(e.start_time), new Date(e.end_time));
            return show().then(function() {
                eventDemoService.navigateToEvent(e);
            });
        }

        function infoWindowCallback(item) {
            // Change the URL but don't reload the page
            if ($location.search().uri !== item.opts.event.id) {
                $location.search('uri', item.opts.event.id);
            }

            self.current = item;
            eventService.fetchRelated(item.opts.event);
            fetchImages(item);
        }

        function fetchImages(item) {
            var photoConfig = Settings.getPhotoConfig();
            if (item.opts.event) {
                photoService.getRelatedPhotosForEvent(item.opts.event, photoConfig).then(function(imgs) {
                    self.images = imgs;
                });
            }
        }

        function getWinterWarUrl() {
            return $translate.use() + '/events/winterwar';
        }
    }
})();
