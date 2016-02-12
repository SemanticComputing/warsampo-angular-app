/**
 * @ngdoc function
 * @name eventsApp.controller:EventDemoCtrl
 * @description
 * # EventDemoCtrl
 * Controller of the eventsApp
 */

(function() {

    'use strict';

    angular.module('eventsApp')
    .controller('EventDemoCtrl', EventDemoController);

    /* @ngInject */
    function EventDemoController($routeParams, $location, $anchorScroll,
                $timeout, $window, $scope, $rootScope, $route, $q, $translate,
                _, Settings, WAR_INFO, eventService, photoService, casualtyRepository,
                personService, googleMapsService, timemapService) {

        var self = this;

        /* Public vars */

        // The currently selected event
        self.current;
        // Images related to currently selected event
        self.images;
        // The title for the info view
        self.title;

        /* Public functions */

        self.showWinterWar = showWinterWar;
        self.showContinuationWar = showContinuationWar;

        /* Private vars */

        // timemap, google map, heatmap
        var tm, map, heatmap;

        /* Activate */

        visualize();

        $rootScope.showHelp = function() {
            self.current = undefined;
        };

        function visualize() {

            self.current = null;
            self.isLoadingTimemap = true;
            var era = $routeParams.era;
            var event_uri = $routeParams.uri;
            var promise;
            if (event_uri) {
                promise = eventService.getEventById(event_uri).then(function(e) {
                    if (e) {
                        return createTimeMapForEvent(e);
                    } else {
                        $location.url($location.path());
                        return self.showWinterWar();
                    }

                });
            } else if (era) {
                switch(era.toLowerCase()) {
                    case 'winterwar': {
                        promise = self.showWinterWar();
                        break;
                    }
                    case 'continuationwar': {
                        promise = self.showContinuationWar();
                        break;
                    }
                }
            } else {
                // No war or event specified -- redirect to Winter War
                $location.path($translate.use() + '/events/winterwar').replace();
                return $q.when();
            }

            // Set listener to prevent reload when it is not desired.
            $scope.$on('$routeUpdate', function() {
                if (!self.noReload) {
                    $route.reload();
                } else {
                    self.noReload = false;
                }
            });

            return promise.then(afterCreateInit).then(function() {
                self.isLoadingTimemap = false;
            }).catch(function(data) {
                self.isLoadingTimemap = false;
                self.err = data;
            });
        }

        function afterCreateInit() {
            getCasualtyCount();
            tm.timeline.setAutoWidth();
            Settings.setApplyFunction(visualize);
            Settings.setHeatmapUpdater(updateHeatmap);
            updateHeatmap();
        }

        function showWinterWar() {
            self.title = 'EVENT_DEMO.WINTER_WAR_EVENT_TITLE';
            return createTimeMap(WAR_INFO.winterWarTimeSpan.start,
                    WAR_INFO.winterWarTimeSpan.end,
                    WAR_INFO.winterWarHighlights);
        }

        function showContinuationWar() {
            self.title = 'EVENT_DEMO.CONTINUATION_WAR_EVENT_TITLE';
            return createTimeMap(WAR_INFO.continuationWarTimeSpan.start,
                    WAR_INFO.continuationWarTimeSpan.end,
                    WAR_INFO.continuationWarHighlights);
        }

        function createTimeMap(start, end, highlights) {

            var photoConfig = Settings.getPhotoConfig();

            return timemapService.createTimemapByTimeSpan(start, end, highlights,
                    infoWindowCallback, photoConfig)
            .then(function(timemap) {
                tm = timemap;
                map = timemap.getNativeMap();
                var band = tm.timeline.getBand(1);

                timemapService.setOnMouseUpListener(onMouseUpListener);
                band.addOnScrollListener(clearHeatmap);
                if (highlights) {
                    tm.timeline.getBand(1).setMaxVisibleDate(new Date(highlights[0].startDate));
                }
            });
        }

        function createTimeMapForEvent(e) {
            var show = getCreateFunction(new Date(e.start_time), new Date(e.end_time));
            return show().then(function() {
                var item = _.find(tm.getItems(), function(item) {
                    return _.isEqual(item.opts.event.id, e.id);
                });
                tm.timeline.getBand(1).setCenterVisibleDate(new Date(e.start_time));
                if (item) {
                    tm.setSelected(item);
                    item.openInfoWindow();
                }
            });
        }

        function getCreateFunction(start, end) {
            if (start >= new Date(WAR_INFO.winterWarTimeSpan.start) &&
                    end <= new Date(WAR_INFO.winterWarTimeSpan.end)) {
                return self.showWinterWar;
            } else {
                return self.showContinuationWar;
            }
        }

        function infoWindowCallback(item) {
            // Change the URL but don't reload the page
            if ($location.search().uri !== item.opts.event.id) {
                self.noReload = true;
                $location.search('uri', item.opts.event.id);
            }

            self.current = item;
            eventService.fetchRelated(item.opts.event);
            fetchImages(item);
        }

        function onMouseUpListener() {
            updateHeatmap();
            getCasualtyCount();
        }

        function fetchImages(item) {
            var photoConfig = Settings.getPhotoConfig();
            photoService.getRelatedPhotosForEvent(item.opts.event, photoConfig).then(function(imgs) {
                self.images = imgs;
            });
        }

        function getCasualtyLocations() {
            var band = tm.timeline.getBand(1);
            var start = band.getMinVisibleDate();
            var end = band.getMaxVisibleDate();
            return casualtyRepository.getCasualtyLocationsByTime(start.toISODateString(),
                    end.toISODateString());
        }

        function getCasualtyCount() {
            var band = tm.timeline.getBand(1);
            var start = band.getMinVisibleDate();
            var end = band.getMaxVisibleDate();
            self.minVisibleDate = start;
            self.maxVisibleDate = end;
            casualtyRepository.getCasualtyCountsByTimeGroupByType(start.toISODateString(), end.toISODateString())
            .then(function(counts) {
                self.casualtyStats = counts;
                var count = 0;
                counts.forEach(function(type) {
                    count += parseInt(type.count);
                });
                self.casualtyCount = count;
            });
        }

        function updateHeatmap() {
            if (Settings.showCasualtyHeatmap) {
                getCasualtyLocations().then(function(locations) {
                    if (!heatmap) {
                        heatmap = googleMapsService.createHeatmap();
                    }
                    googleMapsService.updateHeatmap(heatmap, locations, map);
                });
            } else {
                googleMapsService.clearHeatmap(heatmap);
            }
        }

        function clearHeatmap() {
            if (tm.timeline.getBand(0)._dragging || tm.timeline.getBand(1)._dragging) {
                googleMapsService.createHeatmap(heatmap);
            }
        }

    }
})();
