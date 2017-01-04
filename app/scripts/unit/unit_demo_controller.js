(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('UnitDemoController', UnitDemoController);

    /* @ngInject */
    function UnitDemoController($routeParams, $location, $scope, $q, $uibModal,
            $translate, _, unitService, eventService, Settings, UnitDemoService, WAR_INFO) {

        var self = this;

        var DEFAULT_UNIT = 'http://ldf.fi/warsa/actors/actor_940';
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
            // Update state when url changes.
            $scope.$on('$routeUpdate', function() {
                return updateState();
            });

            Settings.setHelpFunction(showHelp);
            Settings.enableSettings();
            Settings.setApplyFunction(createTimeMap);
            Settings.setHeatmapUpdater(demoService.updateHeatmap);
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
                demoService.cleanUp();
            });

            getItems();

            if (!$routeParams.uri) {
                // Redirect to default unit.
                return $location.search('uri', DEFAULT_UNIT).replace();
            }
            return updateState();
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

            self.items = [{ id:'#', name: 'Etsitään ...' }];

            return unitService.getItems(rx).then(function(data) {
                if (data.length) {
                    self.items = data;
                } else {
                    self.items = [{ id:'#', name:'Ei hakutuloksia.' }];
                }
                return self.items;
            });
        }

        function updateUnit() {
            if (self.currentSelection) {
                demoService.clear();
                $location.search('event', null);
                $location.search('uri', self.currentSelection);
            }
        }

        function showUnitDetails() {
            return !(self.isLoadingEvent || !self.currentObject || self.getCurrent());
        }

        // Update state based on url
        function updateState() {
            var uri = $routeParams.uri;
            if (!uri) {
                // This shouldn't happen.
                return;
            }
            var eventId = $routeParams.event;
            if (uri !== self.unitId) {
                // Unit selection has changed.
                self.promise = self.promise.then(function() {
                    return updateByUri(uri, eventId);
                });
                return self.promise;
            }
            // Unit has not changed.
            if (eventId) {
                // Event in url.
                if (eventId !== (demoService.getCurrent() || {}).id) {
                    // Event has changed due to back/forward action, navigate to the event.
                    self.promise = self.promise.then(function() {
                        return demoService.navigateToEvent(eventId);
                    });
                    return self.promise;
                }
                // Event was selected by the user, the callback has handled everything, so fall through.
            } else {
                // Unit has not changed, and there is no event in url: clear selected event on timeline.
                self.promise = self.promise.then(function() { return demoService.clearCurrent(); });
                return self.promise;
            }
        }

        function updateByUri(uri) {
            self.noEvents = false;
            self.err = undefined;
            self.isLoadingTimeline = true;
            self.unitId = uri;
            var eventId = $routeParams.event;
            if (angular.isString(eventId)) {
                self.isLoadingEvent = true;
            }
            return unitService.getById(uri).then(function(unit) {
                self.currentObject = unit;
                unitService.fetchRelated(unit, true);
                return createTimeMap(uri);
            }).then(function() {
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

        function showHelp() {
            $uibModal.open({
                component: 'helpModal',
                size: 'lg',
                resolve: {
                    title: $translate('UNIT_DEMO.HELP_TEXT_TITLE'),
                    content: $translate('UNIT_DEMO.HELP_TEXT')
                }
            });
        }

        function getDefaultUrl() {
            return $translate.use() + '/units';
        }
    }
})();
