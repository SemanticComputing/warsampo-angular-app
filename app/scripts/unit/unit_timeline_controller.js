(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('UnitTimelineController', UnitTimelineController);

    /* @ngInject */
    function UnitTimelineController($location, $scope, $q, $uibModal,
            $translate, _, unitService, Settings, UnitDemoService, WAR_INFO, unit) {

        var self = this;

        var demoService = new UnitDemoService();

        // User search input
        self.queryregex = '';

        self.unit;

        self.casualtyDescription = 'UNIT_DEMO.CASUALTIES_DURING_TIMESPAN';

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;
        self.getCurrent = getCurrent;
        self.clearEvent = clearEvent;
        self.getImages = getImages;
        self.hasEvents = hasEvents;

        self.showUnitDetails = showUnitDetails;

        // A promise chain for state changes
        self.promise = $q.when();
        // The id of the currently displayed unit
        self.unitId;

        init();

        /* Implementation */

        function hasEvents() {
            return !self.isLoadingTimeline && demoService.hasEvents();
        }

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

        function clearEvent() {
            return demoService.clearCurrent();
        }

        function getImages() {
            return demoService.getImages();
        }

        function init() {

            Settings.enableSettings();
            Settings.setApplyFunction(createTimeMap);
            Settings.setHeatmapUpdater(demoService.updateHeatmap);
            $scope.$on('$destroy', function() {
                demoService.cleanUp();
            });

            return updateByUri(unit, $location.search().event);
        }

        function createTimeMap(id) {
            return demoService.createTimemap(id, WAR_INFO.winterWarTimeSpan.start,
                WAR_INFO.continuationWarTimeSpan.end,
                WAR_INFO.winterWarHighlights.concat(WAR_INFO.continuationWarHighlights));
        }

        function showUnitDetails() {
            return !(self.isLoadingEvent || !self.unit || self.getCurrent());
        }

        function updateByUri(unit, eventId) {
            self.unit = unit;
            self.noEvents = false;
            self.err = undefined;
            self.isLoadingTimeline = true;
            if (angular.isString(eventId)) {
                self.isLoadingEvent = true;
            }
            unitService.fetchRelated(unit, true);
            return createTimeMap(unit.id).then(function() {
                self.isLoadingTimeline = false;
                if (self.isLoadingEvent) {
                    return demoService.navigateToEvent(eventId);
                }
                return demoService.refresh();
            }).then(function() {
                self.isLoadingEvent = false;
            }).catch(function(data) {
                if (data === 'NO_EVENTS') {
                    self.noEvents = true;
                } else {
                    self.err = data ? data.message || data : 'UNKNOWN_ERROR';
                }
                self.isLoadingEvent = false;
                self.isLoadingTimeline = false;
            });
        }

    }
})();
