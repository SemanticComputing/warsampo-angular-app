(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonTimelineController', PersonTimelineController);

    /* @ngInject */
    function PersonTimelineController($q, $scope, $location, $state, $transition$, $uibModal,
            $translate, _, personService, PersonDemoService, Settings, uri) {

        var self = this;
        var demoService = new PersonDemoService();

        self.createTimemap = createTimemap;
        self.changeIncludeUnits = changeIncludeUnits;

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;
        self.getCurrent = getCurrent;
        self.getImages = getImages;

        self.uiOnParamsChanged =  onUriChange;

        self.options = {};

        init();

        function init() {

            $scope.$on('$destroy', function() {
                demoService.cleanUp();
            });

            // Timeline settings
            Settings.enableSettings();
            Settings.setApplyFunction(applySettings);
            Settings.setHeatmapUpdater(demoService.updateHeatmap.bind(demoService));

            self.helpTextTitle = 'PERSONS_DEMO.TIMELINE_HELP_TEXT_TITLE';
            self.helpText = 'PERSONS_DEMO.TIMELINE_HELP_TEXT';

            self.options.includeUnitEvents = true;

            return updateByUri(uri, $transition$.params().event);
        }

        function applySettings() {
            return createTimemap();
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
            self.isLoadingLinks = true;
            self.isLoadingTimeline = true;
            self.personId = uri;
            return personService.getById(uri)
            .then(function(person) {
                self.person = person;
                self.isLoadingObject = false;
                return personService.fetchRelated(person);
            }).then(function(person) {
                self.isLoadingLinks = false;
                return demoService.getEventTypes(person, self.options);
            }).then(function(types) {
                self.options.types = types;
                return types;
            }).then(function() {
                self.isTimemapInit = true;
                return createTimemap();
            }).then(function() {
                if (eventId) {
                    return demoService.navigateToEvent(eventId);
                }
                return demoService.refresh();
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
                self.isLoadingLinks = false;
                self.isLoadingEvent = false;
                self.isLoadingTimeline = false;
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

        function onUriChange(newValues) {
            if (newValues.event && newValues.event !== (self.getCurrent() || {}).id) {
                return demoService.navigateToEvent(newValues.event);
            }
            return $q.when();
        }

    }
})();
