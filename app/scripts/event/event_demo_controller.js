(function() {

    'use strict';

    angular.module('eventsApp')
    .controller('EventDemoCtrl', EventDemoController);

    /* @ngInject */
    function EventDemoController($routeParams, $location, $scope, $q, $translate,
                $uibModal, _, Settings, WAR_INFO, eventService, photoService, casualtyRepository,
                googleMapsService, EventDemoService) {

        /* Private vars */

        var self = this;
        var eventDemoService = new EventDemoService();

        /* Public vars */

        // The title for the info view
        self.title;

        self.showCasualtyStats = false;

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;
        self.getCurrent = getCurrent;
        self.getImages = getImages;

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

        function getCurrent() {
            return eventDemoService.getCurrent();
        }

        function getImages() {
            return eventDemoService.getImages();
        }

        function init() {
            Settings.setHelpFunction(showHelp);
            Settings.enableSettings();
            Settings.setApplyFunction(visualize);
            Settings.setHeatmapUpdater(eventDemoService.updateHeatmap);

            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
                eventDemoService.cleanUp();
            });

            return visualize();
        }

        function visualize() {
            self.err = undefined;
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
                        // Event not found, redirect to Winter War
                        $location.path(getWinterWarUrl()).replace();
                        return $q.when();
                    }

                });
            } else if (era) {
                // Only war given
                switch(era.toLowerCase()) {
                    case 'winterwar': {
                        promise = showWinterWar().then(function() { return eventDemoService.refresh(); });
                        break;
                    }
                    case 'continuationwar': {
                        promise = showContinuationWar().then(function() { return eventDemoService.refresh(); });
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
                data = data || 'Unknown error';
                self.isLoadingTimemap = false;
                self.err = data.message || data;
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

        function getCreateFunction(start) {
            if (new Date(start) < new Date(WAR_INFO.winterWarTimeSpan.end)) {
                return showWinterWar;
            } else {
                return showContinuationWar;
            }
        }

        function createTimeMapForEvent(e) {
            if (!e.start_time) {
                return showWinterWar();
            }
            var show = getCreateFunction(e.start_time);
            return show().then(function() {
                return eventDemoService.navigateToEvent(e);
            });
        }

        function getWinterWarUrl() {
            return $translate.use() + '/events/winterwar';
        }

        function showHelp() {
            $uibModal.open({
                templateUrl: 'views/partials/event.help.html',
                size: 'lg'
            });
        }
    }
})();
