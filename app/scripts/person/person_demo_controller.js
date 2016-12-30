(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonDemoController', PersonDemoController);

    /* @ngInject */
    function PersonDemoController($q, $scope, $routeParams, $location, personService,
            PersonDemoService, eventService, Settings, WAR_INFO) {

        var self = this;
        var demoService = new PersonDemoService();

        self.items = [];
        self.queryregex = '';

        self.updateByUri = updateByUri;
        self.updateSelection = updateSelection;
        self.getItems = getItems;

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;
        self.getCurrent = getCurrent;
        self.getImages = getImages;
        self.selectTab = selectTab;

        self.promise = $q.when();
        self.personId;

        init();

        $scope.$on('$routeUpdate', function() {
            var uri = $routeParams.uri;
            if (!uri) {
                return $location.search('uri', 'http://ldf.fi/warsa/actors/person_50');
            }
            var tab = parseInt($routeParams.tab);
            var eventId = $routeParams.event;
            if (!tab && eventId) {
                return $location.search('tab', 2);
            }
            self.activeTab = tab || 1;
            if (uri !== self.personId || (self.activeTab === 2 && !self.isTimemapInit)) {
                self.promise = self.promise.then(function() { return updateByUri(uri, eventId); });
                return self.promise;
            }
            if (eventId) {
                if (self.activeTab === 2 && eventId !== (demoService.getCurrent() || {}).id) {
                    self.promise = self.promise.then(function() { return demoService.navigateToEvent(eventId); });
                    return self.promise;
                }
            } else {
                self.promise = self.promise.then(function() { return demoService.clearCurrent(); });
                return self.promise;
            }
        });

        function init() {
            Settings.enableSettings();
            Settings.setApplyFunction(createTimeMap);
            Settings.setHeatmapUpdater(demoService.updateHeatmap.bind(demoService));
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
                demoService.cleanUp();
            });

            var tab = parseInt($routeParams.tab);
            if (tab) {
                self.activeTab = tab;
            }

            self.getItems();
            var uri = $routeParams.uri || 'http://ldf.fi/warsa/actors/person_50';
            var eventId = $routeParams.event;
            updateByUri(uri, eventId);
        }

        function selectTab(index) {
            $location.search('tab', index);
        }

        function createTimeMap() {
            if (!self.person.timelineEvents) {
                demoService.clear();
                self.isLoadingTimeline = false;
                self.noEvents = true;
                return $q.when();
            }
            self.noEvents = false;
            self.isLoadingTimeline = true;
            return demoService.createTimemap(self.person, WAR_INFO.winterWarTimeSpan.start,
                    WAR_INFO.continuationWarTimeSpan.end,
                    WAR_INFO.winterWarHighlights.concat(WAR_INFO.continuationWarHighlights))
            .then(function(data) {
                self.isLoadingTimeline = false;
                return data;
            });
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

        function getImages() {
            return demoService.getImages();
        }

        function updateByUri(uri, eventId) {
            self.isLoadingObject = true;
            self.isLoadingTimeline = true;
            self.personId = uri;
            return personService.getById(uri)
            .then(function(person) {
                self.person = person;
                self.isLoadingObject = false;

                return personService.fetchRelatedForDemo(person);
            }).then(function() {
                if (self.activeTab === 2) {
                    self.isTimemapInit = true;
                    return createTimeMap();
                }
                self.isTimemapInit = false;
                return $q.when(false);
            }).then(function(refresh) {
                if (refresh && eventId) {
                    return demoService.navigateToEvent(eventId);
                }
                if (refresh) {
                    return demoService.refresh();
                }
            }).then(function() {
                self.err = undefined;
                self.isLoadingTimeline = false;
                return uri;
            }).catch(function(err) {
                self.err = err;
                self.isLoadingObject = false;
                self.isLoadingEvent = false;
                self.isLoadingTimeline = false;
            });
        }

        function updateSelection() {
            if (self.selectedItem && self.selectedItem.id) {
                $location.search('event', null);
                $location.search('uri', self.selectedItem.id);
            }
        }

        function getItems() {
            var rx='', n=self.queryregex.length;
            if (n<1) {
                rx= '^AA.*$';
            } else if (n<2) {
                rx= '^'+self.queryregex+'A.*$';
            } else {
                rx= self.queryregex;
                if (rx.indexOf(' ')>0) {
                    var arr=rx.split(' ');
                    rx='';
                    for (var i=0; i<arr.length; i++) {
                        rx += '(?=.*'+arr[i]+')';
                    }
                }
                rx= '(^|^.* )'+rx+'.*$';
            }
            self.items = [ {id:'#', name:'Etsitään ...'} ];
            return personService.getItems(rx).then(function(data) {
                self.items = data;
            });
        }
    }
})();
