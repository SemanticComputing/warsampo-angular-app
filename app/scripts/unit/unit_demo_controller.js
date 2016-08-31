(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('UnitDemoCtrl', UnitDemoController);

    /* @ngInject */
    function UnitDemoController($routeParams, $location, $scope, $q, $uibModal,
            $translate, _, unitService, eventService, Settings, UnitDemoService, WAR_INFO) {

        var self = this;

        var defaultUnit = 'http://ldf.fi/warsa/actors/actor_940';
        var unitDemoService = new UnitDemoService();

        // User search input
        self.queryregex = '';

        self.getItems = getItems;
        self.updateUnit = updateUnit;
        self.currentUnit;

        self.getDefaultUrl = getDefaultUrl;

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;
        self.getCurrent = getCurrent;
        self.getImages = getImages;

        init();

        /* Implementation */

        function getCasualtyCount() {
            return unitDemoService.getCasualtyCount();
        }

        function getCasualtyStats() {
            return unitDemoService.getCasualtyStats();
        }

        function getMinVisibleDate() {
            return unitDemoService.getMinVisibleDate();
        }

        function getMaxVisibleDate() {
            return unitDemoService.getMaxVisibleDate();
        }

        function getCurrent() {
            return unitDemoService.getCurrent();
        }

        function getImages() {
            return unitDemoService.getImages();
        }

        function init() {
            Settings.setHelpFunction(showHelp);
            Settings.enableSettings();
            Settings.setApplyFunction(update);
            Settings.setHeatmapUpdater(unitDemoService.updateHeatmap);
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
                unitDemoService.cleanUp();
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
            return unitDemoService.createTimemap(id, WAR_INFO.winterWarTimeSpan.start,
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
            if (self.currentUnit) {
                $location.search('event', null);
                return updateByUri(self.currentUnit.id);
            }
        }

        function updateByUri(uri) {
            self.err = undefined;
            self.isLoadingTimeline = true;
            self.isLoadingEvent = true;
            self.isLoadingLinks = false;
            if ($location.search().uri != uri) {
                $location.search('uri', uri);
            }
            return unitService.getById(uri).then(function(unit) {
                self.currentUnit = unit;
                self.isLoadingEvent = false;
                self.isLoadingTimeline = true;
                unitService.fetchRelated(unit, true);
                return createTimeMap(uri);
            }).then(function() {
                self.isLoadingTimeline = false;
                var eventId = $location.search().event;
                if (angular.isString(eventId)) {
                    return eventService.getEventById(eventId).then(function(event) {
                        return unitDemoService.navigateToEvent(event);
                    });
                }
                return unitDemoService.refresh();
            }).catch(function(data) {
                self.err = data.message || data;
                self.isLoadingEvent = false;
                self.isLoadingLinks = false;
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
