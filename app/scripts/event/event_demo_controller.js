(function() {

    'use strict';

    angular.module('eventsApp')
    .controller('EventDemoController', EventDemoController);

    /* @ngInject */
    function EventDemoController($transition$, $location, $scope, $q, $translate,
            $uibModal, _, Settings, WAR_INFO, eventService, photoService, casualtyRepository,
            googleMapsService, EventDemoService) {

        var war = $transition$.params().war;

        /* Private vars */

        var self = this;
        var demoService = new EventDemoService();
        // A promise chain for state changes
        self.promise = $q.when();

        /* Public vars */

        // The title for the info view
        self.title;

        self.helpTextTitle = 'EVENT_DEMO.HELP_TEXT_TITLE';
        self.helpText = 'EVENT_DEMO.HELP_TEXT';
        self.casualtyDescription = 'CASUALTIES_DURING_TIMESPAN';

        self.isLoadingTimeline;

        self.showCasualtyStats = false;

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;
        self.getCurrent = getCurrent;
        self.getImages = getImages;
        self.getWinterWarUrl = getWinterWarUrl;
        self.visualize = visualize;

        /* Activate */

        init();
        return self;

        /* Implementation */

        function getCasualtyCount() {
            return demoService.getCasualtyCount();
        }

        function getCasualtyStats() {
            return demoService.getCasualtyStats();
        }

        function getMinVisibleDate() {
            return demoService.getMinVisibleDate();
        }

        function getMaxVisibleDate() {
            return demoService.getMaxVisibleDate();
        }

        function getCurrent() {
            return demoService.getCurrent();
        }

        function getImages() {
            return demoService.getImages();
        }

        function init() {
            Settings.setHelpFunction(showHelp);
            Settings.enableSettings();
            Settings.setApplyFunction(visualize);
            Settings.setHeatmapUpdater(demoService.updateHeatmap);

            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
                demoService.cleanUp();
            });
        }

        function visualize() {
            self.err = undefined;
            self.isLoadingTimeline = true;
            var era = war;
            var event_uri = $location.search().uri;
            var promise;
            if (event_uri) {
                // Single event given as parameter
                promise = eventService.getEventById(event_uri).then(function(e) {
                    if (e && e.start_time) {
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
                        promise = showWinterWar().then(function() { return demoService.refresh(); });
                        break;
                    }
                    case 'continuationwar': {
                        promise = showContinuationWar().then(function() { return demoService.refresh(); });
                        break;
                    }
                }
            } else {
                // No war or event specified -- redirect to Winter War
                $location.path(getWinterWarUrl()).replace();
                return $q.when();
            }

            return promise.then(function() {
                self.isLoadingTimeline = false;
            }).catch(function(data) {
                data = data || 'Unknown error';
                self.isLoadingTimeline = false;
                self.err = data.message || data;
            });
        }

        function showWinterWar() {
            self.title = 'EVENT_DEMO.WINTER_WAR_EVENT_TITLE';
            return demoService.createTimemap(WAR_INFO.winterWarTimeSpan.start,
                WAR_INFO.winterWarTimeSpan.end,
                WAR_INFO.winterWarHighlights);
        }

        function showContinuationWar() {
            self.title = 'EVENT_DEMO.CONTINUATION_WAR_EVENT_TITLE';
            return demoService.createTimemap(WAR_INFO.continuationWarTimeSpan.start,
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
            var show = getCreateFunction(e.start_time);
            return show().then(function() {
                return demoService.navigateToEvent(e);
            });
        }

        function getWinterWarUrl() {
            return $translate.use() + '/events/winterwar';
        }

        function showHelp() {
            $uibModal.open({
                component: 'helpModal',
                size: 'lg',
                resolve: {
                    title: $translate('EVENT_DEMO.HELP_TEXT_TITLE'),
                    content: $translate('EVENT_DEMO.HELP_TEXT')
                }
            });
        }
    }
})();
