(function() {
    'use strict';

    /**
    * @ngdoc function
    * @name eventsApp.controller:EventPageController
    * @description
    * # EventPageController
    * Controller of the eventsApp
    */
    angular.module('eventsApp')
    .controller('EventPageController', EventPageController);

    function EventPageController($q, $rootScope, $state, $translate,
            _, eventService, baseService, photoService, Settings, EVENT_TYPES, uri) {

        $rootScope.showHelp = null;

        var self = this;
        self.images = undefined;

        self.fetchImages = function() {
            fetchImages(self.event);
        };

        init();

        function init() {
            Settings.setApplyFunction(self.fetchImages);

            if (!uri) {
                return;
            }
            self.error = undefined;
            self.isLoadingEvent = true;
            self.isLoadingLinks = true;
            eventService.getEventById(uri)
            .then(function(event) {
                self.event = event;
                return eventService.fetchRelated(self.event);
            }).then(function(event) {
                self.demoLink = getDemoLink(event);
                self.isLoadingEvent = false;

                var placeEventPromise = eventService.getEventsByPlaceIdPager(
                    _.map(self.event.places, 'id'), { pageSize: Settings.pageSize, idFilter: self.event.id });
                var timeEventPromise = eventService.getEventsLooselyWithinTimeSpanPager(
                    self.event.start_time, self.event.end_time, { pageSize: Settings.pageSize, idFilter: self.event.id });
                return $q.all([
                    placeEventPromise,
                    timeEventPromise,
                    fetchImages(self.event)
                ]);
            })
            .then(function(events) {
                $q.all([events[0].getTotalCount(), events[1].getTotalCount()])
                .then(function(counts) {
                    if (counts[0] || counts[1]) {
                        self.event.hasLinks = true;
                    }
                    self.relatedEventsByPlace = events[0];
                    self.relatedEventsByTime = events[1];
                    self.isLoadingLinks = false;
                });
            }).catch(function(err) {
                self.error = err;
                self.isLoadingEvent = false;
                self.isLoadingLinks = false;
            });
        }

        function getDemoLink(event) {
            var state;
            var personsState = 'app.lang.persons.demo.page.timeline';
            var unitsState = 'app.lang.units.demo.timeline';
            var stateParams = {
                lang: $translate.use()
            };
            switch(event.type_id) {
                case EVENT_TYPES.BATTLE:
                case EVENT_TYPES.TROOP_MOVEMENT:
                case EVENT_TYPES.UNIT_JOINING:
                case EVENT_TYPES.UNIT_FORMATION:
                case EVENT_TYPES.UNIT_NAMING:
                case EVENT_TYPES.DISSOLUTION:
                    state = unitsState;
                    stateParams.id = getUnitId(event);
                    break;
                case EVENT_TYPES.PROMOTION:
                case EVENT_TYPES.PERSON_JOINING:
                case EVENT_TYPES.BIRTH:
                case EVENT_TYPES.DEATH:
                case EVENT_TYPES.DISSAPEARING:
                case EVENT_TYPES.MEDAL_ASSIGNMENT:
                    state = personsState;
                    stateParams.id = getParticipantId(event);
                    stateParams.tab = 2;
                    break;
                case EVENT_TYPES.PHOTOGRAPHY:
                    if (event.participant_id) {
                        state = personsState;
                        stateParams.id = getParticipantId(event);
                        stateParams.tab = 2;
                    } else if (event.units) {
                        state = unitsState;
                        stateParams.id = getUnitId(event);
                    } else {
                        state = undefined;
                    }
                    break;
                default:
                    stateParams.uri = event.id;
                    stateParams.war = parseInt((event.start_time || '0').substring(0, 4)) > 1940 ? 'continuationwar' : 'winterwar';
                    state = 'app.lang.events.demo.war';
            }
            if (!state) {
                return undefined;
            }
            if (_.includes([personsState, unitsState], state)) {
                stateParams.event = event.id;
            }
            return $state.href(state, stateParams);
        }

        function getParticipantId(event) {
            return baseService.getIdFromUri(
                _.isArray(event.participant_id) ? event.participant_id[0] : event.participant_id);
        }

        function getUnitId(event) {
            return baseService.getIdFromUri(((event.units || [])[0] || {}).id);
        }

        function fetchImages(event) {
            self.isLoadingImages = true;
            var photoConfig = Settings.getPhotoConfig();
            self.images = undefined;
            photoService.getRelatedPhotosForEvent(event, photoConfig).then(function(imgs) {
                self.images = imgs;
                self.isLoadingImages = false;
            });
        }
    }
})();
