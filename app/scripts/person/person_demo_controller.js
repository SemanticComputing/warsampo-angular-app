(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonDemoController', PersonDemoController);

    /* @ngInject */
    function PersonDemoController($scope, $routeParams, $location, personService,
            PersonDemoService, eventService, Settings, WAR_INFO) {

        var self = this;
        var demoService = new PersonDemoService();

        self.items = [];
        self.queryregex = '';

        self.updateByUri = updateByUri;
        self.updateActor = updateActor;
        self.getItems = getItems;

        self.getCasualtyCount = getCasualtyCount;
        self.getCasualtyStats = getCasualtyStats;
        self.getMinVisibleDate = getMinVisibleDate;
        self.getMaxVisibleDate = getMaxVisibleDate;
        self.getCurrent = getCurrent;
        self.getImages = getImages;

        init();

        function init() {
            Settings.enableSettings();
            Settings.setApplyFunction(self.updateActor);
            Settings.setHeatmapUpdater(demoService.updateHeatmap);
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
                demoService.cleanUp();
            });

            self.getItems();

            if ($routeParams.uri) {
                self.updateByUri($routeParams.uri);
            } else {
                self.selectedItem = {
                    name: 'Talvela, Paavo Juho',
                    id: 'http://ldf.fi/warsa/actors/person_50'
                };
                self.updateActor();
            }
        }

        function createTimeMap(person) {
            return demoService.createTimemap(person, WAR_INFO.winterWarTimeSpan.start,
                    WAR_INFO.continuationWarTimeSpan.end,
                    WAR_INFO.winterWarHighlights.concat(WAR_INFO.continuationWarHighlights));
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

        function updateByUri(uri) {
            self.isLoadingObject = true;
            self.isLoadingTimeline = true;
            if ($location.search().uri != uri) {
                $location.search('uri', uri);
            }
            var eventId = $location.search().event;
            if (angular.isString(eventId)) {
                self.isLoadingEvent = true;
            }
            return personService.getById(uri)
            .then(function(person) {
                self.person = person;
                self.isLoadingObject = false;

                return personService.fetchRelatedForDemo(person);
            }).then(function(person) {
                return createTimeMap(person);
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
            }).catch(function() {
                self.isLoadingObject = false;
                self.isLoadingEvent = false;
                self.isLoadingTimeline = false;
            });
        }

        function updateActor() {
            if (self.selectedItem && self.selectedItem.id) {
                var uri = self.selectedItem.id;
                $location.search('event', null);

                self.updateByUri(uri);
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
            personService.getItems(rx,self);
        }
    }
})();
