(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonDemoController', PersonDemoController);

    /* @ngInject */
    function PersonDemoController($q, $scope, $routeParams, $location, $uibModal,
            $translate, _, personService, PersonDemoService, eventService, Settings) {

        var self = this;
        var demoService = new PersonDemoService();

        var INFO_TAB = 1;
        var TIMELINE_TAB = 2;
        var DEFAULT_PERSON = 'http://ldf.fi/warsa/actors/person_50';

        // Person selection list
        self.items = [];
        // User search input
        self.queryregex = '';

        self.updateSelection = updateSelection;
        self.getItems = getItems;
        self.createTimemap = createTimemap;
        self.changeIncludeUnits = changeIncludeUnits;

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;
        self.getCurrent = getCurrent;
        self.getImages = getImages;
        self.selectTab = selectTab;

        // A promise chain for state changes
        self.promise = $q.when();
        // The id of the currently displayed person
        self.personId;

        self.options = {};

        init();

        function init() {
            // Update state when url changes.
            $scope.$on('$routeUpdate', function() {
                return updateState();
            });

            // Timeline settings
            Settings.setHelpFunction(showHelp);
            Settings.enableSettings();
            Settings.setApplyFunction(applySettings);
            Settings.setHeatmapUpdater(demoService.updateHeatmap.bind(demoService));

            self.helpTextTitle = 'PERSONS_DEMO.TIMELINE_HELP_TEXT_TITLE';
            self.helpText = 'PERSONS_DEMO.TIMELINE_HELP_TEXT';

            // Cleanup
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
                demoService.cleanUp();
            });

            var tab = parseInt($routeParams.tab);
            if (tab) {
                self.activeTab = tab;
            }

            self.options.includeUnitEvents = true;

            self.getItems();

            if (!$routeParams.uri) {
                // Redirect to default person.
                return $location.search('uri', DEFAULT_PERSON).replace();
            }
            return updateState();
        }

        function showHelp() {
            $uibModal.open({
                component: 'helpModal',
                size: 'lg',
                resolve: {
                    title: $translate('PERSONS_DEMO.HELP_TEXT_TITLE'),
                    content: $translate('PERSONS_DEMO.HELP_TEXT')
                }
            });
        }

        // Update state based on url
        function updateState() {
            var uri = $routeParams.uri;
            if (!uri) {
                // This shouldn't happen.
                return;
            }
            var tab = parseInt($routeParams.tab);
            var eventId = $routeParams.event;
            // Default to timeline if url has event but no tab.
            if (!tab && eventId) {
                return $location.search('tab', TIMELINE_TAB);
            }
            // Otherwise default to info tab.
            self.activeTab = tab || INFO_TAB;
            if (uri !== self.personId || (self.activeTab === TIMELINE_TAB && !self.isTimemapInit)) {
                // Person selection has changed, or timeline tab is selected for the first time.
                self.promise = self.promise.then(function() {
                    return updateByUri(uri, eventId);
                });
                return self.promise;
            }
            // Person has not changed.
            if (eventId) {
                // Event in url.
                if (self.activeTab === TIMELINE_TAB && eventId !== (demoService.getCurrent() || {}).id) {
                    // Event has changed due to back/forward action (and timeline is selected),
                    // navigate to the event.
                    self.promise = self.promise.then(function() {
                        return demoService.navigateToEvent(eventId);
                    });
                    return self.promise;
                }
                // Event was selected by the user, the callback has handled everything, so fall through.
            } else {
                // Person has not changed, and there is no event in url: clear selected event on timeline.
                self.promise = self.promise.then(function() { return demoService.clearCurrent(); });
                return self.promise;
            }
        }

        function applySettings() {
            if (self.activeTab === TIMELINE_TAB) {
                return createTimemap();
            }
            return $q.when();
        }

        function selectTab(index) {
            $location.search('tab', index);
        }

        function createTimemap() {
            return demoService.getTimelineEvents(self.person, self.options)
            .then(function(person) {
                if (!person.timelineEvents) {
                    demoService.clear();
                    self.isLoadingTimeline = false;
                    self.noEvents = true;
                    return $q.when(false);
                }
                self.noEvents = false;
                self.isLoadingTimeline = true;
                return demoService.createTimemap(person)
                .then(function(data) {
                    self.isLoadingTimeline = false;
                    return data;
                });
            });
        }

        function changeIncludeUnits() {
            return demoService.getEventTypes(self.person, self.options)
            .then(function(types) {
                self.options.types = types;
                return createTimemap();
            });
        }

        // Get person details, and update timemap if needed.
        function updateByUri(uri, eventId) {
            self.isLoadingObject = true;
            self.isLoadingTimeline = true;
            self.personId = uri;
            return personService.getById(uri)
            .then(function(person) {
                self.person = person;
                self.isLoadingObject = false;
                return personService.fetchRelatedForDemo(person);
            }).then(function(person) {
                return demoService.getEventTypes(person, self.options);
            }).then(function(types) {
                self.options.types = types;
                return types;
            }).then(function() {
                if (self.activeTab === TIMELINE_TAB) {
                    self.isTimemapInit = true;
                    return createTimemap();
                }
                self.isTimemapInit = false;
                return $q.when(false);
            }).then(function(refresh) {
                if (refresh !== false && eventId) {
                    return demoService.navigateToEvent(eventId);
                }
                if (refresh !== false) {
                    return demoService.refresh();
                }
            }).then(function() {
                self.err = undefined;
                self.isLoadingTimeline = false;
                return uri;
            }).catch(function(err) {
                if (err === 'NO_EVENTS') {
                    self.noEvents = true;
                } else {
                    self.err = err;
                }
                self.isLoadingObject = false;
                self.isLoadingEvent = false;
                self.isLoadingTimeline = false;
            });
        }

        // Person selection change
        function updateSelection() {
            if (self.selectedItem && self.selectedItem.id) {
                demoService.clear();
                $location.search('event', null);
                $location.search('uri', self.selectedItem.id);
            }
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
