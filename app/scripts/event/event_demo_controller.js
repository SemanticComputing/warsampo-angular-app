'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:EventDemoCtrl
 * @description
 * # EventDemoCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('EventDemoCtrl', function ($routeParams, $location, $anchorScroll,
              $timeout, $window, $scope, $rootScope, $route, Settings,
              eventService, photoService, casualtyRepository, personService, timemapService) {

    var self = this;

    // The currently selected event
    self.current = undefined;
    // Images related to currently selected event
    self.images = undefined;
    // timemap, google map, heatmap
    var tm, map, heatmap;

    self.title = undefined;

    $rootScope.showHelp = function() {
        self.current = undefined;
    };

    var fetchImages = function(item) {
        var photoConfig = Settings.getPhotoConfig();
        photoService.getRelatedPhotosForEvent(item.opts.event, photoConfig).then(function(imgs) {
            self.images = imgs;
        });
    };

    self.updateTimeline = function() {
        self.visualize();
    };

    var getCasualtyLocations = function() {
        var band = tm.timeline.getBand(1);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        return casualtyRepository.getCasualtyLocationsByTime(start.toISODateString(), end.toISODateString())
            .then(function(casualties) {
                var res = [];
                casualties.forEach(function(casualty) {
                    res.push(new google.maps.LatLng(parseFloat(casualty.lat), parseFloat(casualty.lon)));
                });
                return res;
            });
    };

    var getCasualtyCount = function() {
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
    };

    var heatmapListener = function() {
        if (Settings.showCasualtyHeatmap) {
            getCasualtyLocations().then(function(locations) {
                heatmap.setData(locations);
                heatmap.setMap(map);
            });
        }
    };

    var clearHeatmap = function() {
        if (tm.timeline.getBand(0)._dragging || tm.timeline.getBand(1)._dragging) {
            heatmap.setMap(null);
        }
    };

    self.updateHeatmap = function() {
        if (Settings.showCasualtyHeatmap) {
            heatmapListener();
        } else {
            heatmap.setMap(null);
        }
    };

    // Set listener to prevent reload when it is not desired.
    $scope.$on('$routeUpdate', function() {
        if (!self.noReload) {
            $route.reload();
        } else {
            self.noReload = false;
        }
    });

    var infoWindowCallback = function(item) {
        // Change the URL but don't reload the page
        if ($location.search().uri !== item.opts.event.id) {
            self.noReload = true;
            $location.search('uri', item.opts.event.id);
        }

        self.current = item;
        eventService.fetchRelated(item.opts.event);
        fetchImages(item);
    };

    var onMouseUpListener = function() {
        heatmapListener();
        getCasualtyCount();
    };

    self.afterCreateInit = function() {
        getCasualtyCount();
        tm.timeline.setAutoWidth();
        getCasualtyLocations().then(function(locations) {
            heatmap = new google.maps.visualization.HeatmapLayer({
                data: locations,
                radius: 20
            });
            Settings.setApplyFunction(self.updateTimeline);
            Settings.setHeatmapUpdater(self.updateHeatmap);
            self.updateHeatmap();
        });
    };

    self.createTimeMap = function(start, end, highlights) {

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
    };

    var winterWarHighlights = [
        {
            startDate: "1939-11-30",
            endDate: "1940-03-13",
            color:      "#94BFFF",
            opacity:    20,
            startLabel: "Talvisota",
            endLabel:   "",
            cssClass: "band-highlight"
        }
    ];

    var continuationWarHighlights = [
        {
            startDate: "1941-06-25",
            endDate: "1944-09-19",
            color:      "#FFC080",
            opacity:    20,
            startLabel: "Jatkosota",
            endLabel:   "",
            cssClass: "band-highlight"
        }
    ];

    var winterWarTimeSpan = {
        start: '1939-07-01',
        end: '1940-04-30'
    };
    var continuationWarTimeSpan = {
        start: '1941-06-01',
        end: '1944-12-31'
    };

    self.showWinterWar = function() {
        self.title = "Talvisodan tapahtumat";
        return self.createTimeMap(winterWarTimeSpan.start, winterWarTimeSpan.end, winterWarHighlights);
    };
    self.showContinuationWar = function() {
        self.title = "Jatkosodan tapahtumat";
        return self.createTimeMap(continuationWarTimeSpan.start,
                continuationWarTimeSpan.end, continuationWarHighlights);
    };
    var getCreateFunction = function(start, end) {
        if (start >= new Date(winterWarTimeSpan.start) &&
                end <= new Date(winterWarTimeSpan.end)) {
            return self.showWinterWar;
        } else {
            return self.showContinuationWar;
        }
    };

    self.createTimeMapForEvent = function(e) {
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
    };

    self.visualize = function() {

        self.isLoadingTimemap = true;
        var era = $routeParams.era;
        var event_uri = $routeParams.uri;
        var promise = null;
        if (event_uri) {
            promise = eventService.getEventById(event_uri).then(function(e) {
                if (e) {
                    return self.createTimeMapForEvent(e);
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
            $location.path('events/winterwar').replace();
            promise = self.showWinterWar();
        }

        return promise.then(self.afterCreateInit).then(function() {
            self.isLoadingTimemap = false;
        });
    };

    self.visualize();

});
