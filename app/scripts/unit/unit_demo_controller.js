(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('UnitDemoController', UnitDemoController);

    /* @ngInject */
    function UnitDemoController($routeParams, $location, $scope, $q, $uibModal,
            $translate, _, unitService, eventService, Settings, UnitDemoService, WAR_INFO) {

        var self = this;

        var defaultUnit = 'http://ldf.fi/warsa/actors/actor_940';
        var demoService = new UnitDemoService();

        // User search input
        self.queryregex = '';

        self.getItems = getItems;
        self.updateUnit = updateUnit;
        self.currentObject;

        self.casualtyDescription = 'UNIT_DEMO.CASUALTIES_DURING_TIMESPAN';

        self.getDefaultUrl = getDefaultUrl;

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;
        self.getCurrent = getCurrent;
        self.clearEvent = clearEvent;
        self.getImages = getImages;
        self.hasEvents = hasEvents;

        self.showUnitDetails = showUnitDetails;

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
            Settings.setHelpFunction(showHelp);
            Settings.enableSettings();
            Settings.setApplyFunction(update);
            Settings.setHeatmapUpdater(demoService.updateHeatmap);
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
                demoService.cleanUp();
            });

            getItems();

            return update();

        }

        function update() {
            if ($routeParams.uri) {
                return updateByUri($routeParams.uri);
            } else {
                return updateByUri(defaultUnit);
            }
        }

        function createTimeMap(id) {
            return demoService.createTimemap(id, WAR_INFO.winterWarTimeSpan.start,
                    WAR_INFO.continuationWarTimeSpan.end,
                    WAR_INFO.winterWarHighlights.concat(WAR_INFO.continuationWarHighlights));
        }

        function getItems() {
            var rx = self.queryregex;
            var testAlphabet = /[^.0-9 ]/g;

            if (rx.length<1) { rx='^1.*$'; }
            else if (!testAlphabet.test(rx)) { rx = '^.*'+rx+'.*$'; }
            else if (rx.length<2) { rx='^'+rx; }
            else if (rx.length<5) { rx = '(^|^.* )'+rx+'.*$'; }
            else {
                rx = rx.replace(' ','.*');
                rx = '^.*'+rx+'.*$';
            }

            self.items = [ {id:'#', name:'Etsitään ...'} ];

            return unitService.getItems(rx).then(function(data) {
                if (data.length) {
                    self.items = data;
                }
                else {
                    self.items = [ {id:'#', name:'Ei hakutuloksia.'} ];
                }
                return self.items;
            });
        }

        function updateUnit() {
            if (self.currentObject) {
                $location.search('event', null);
                return updateByUri(self.currentObject.id);
            }
        }

        function showUnitDetails() {
            return !(self.isLoadingEvent || !self.currentObject || self.getCurrent());
        }

        function updateByUri(uri) {
            self.err = undefined;
            self.isLoadingTimeline = true;
            var eventId = $location.search().event;
            if (angular.isString(eventId)) {
                self.isLoadingEvent = true;
            }
            if ($location.search().uri != uri) {
                $location.search('uri', uri);
            }
            return unitService.getById(uri).then(function(unit) {
                self.currentObject = unit;
                unitService.fetchRelated(unit, true);
                return createTimeMap(uri);
            }).then(function() {
                self.isLoadingTimeline = false;
                if (self.isLoadingEvent) {
                    return eventService.getEventById(eventId).then(function(event) {
                        return demoService.navigateToEvent(event);
                    });
                }
                return demoService.refresh();
            }).then(function() {
                self.isLoadingEvent = false;
            }).catch(function(data) {
                self.err = data.message || data;
                self.isLoadingEvent = false;
                self.isLoadingTimeline = false;
            });
        }

        function showHelp() {
            $uibModal.open({
                templateUrl: 'views/partials/unit.help.html',
                size: 'lg'
            });
        }

        function getDefaultUrl() {
            return $translate.use() + '/units';
        }
    }
})();
