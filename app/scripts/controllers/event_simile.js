'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # SimileMapCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SimileMapCtrl', function ($routeParams, $location, $anchorScroll,
              $timeout, $window, $scope, $rootScope, $route, Settings,
              eventService, photoService, casualtyService, actorService, timemapService) {

    var self = this;

    // The currently selected event
    self.current = undefined;
    // Images related to currently selected event
    self.images = undefined;
    // Current image page
    var tm, map, heatmap;

    $rootScope.showHelp = function() {
        self.current = undefined;
    };

    self.getEventTitleWithLinks = function(event) {
        var time = eventService.createTitle(event);
        var place;

        if (event.place) {
            var link = "<a href={0}>{1}</a>";
            if (_.isArray(event.place)) {
                place = _(event.place).pluck('label').forEach(function(p) {
                    return link.format(p.id, p.label);
                }).join(", ");
            } else {
                place = link.format(event.place.id, event.place.label);
            }

            return place + ' ' + time; 
        }

        return time;
    };

    var fetchRelatedPeople = function(item) {
        if (item.participant_id) {
            casualtyService.getCasualtyInfo(item.participant_id).then(function(participants) {
                self.current.related_people = participants;
            });
            fetchActors(item);
        }
    };

    var fetchActors = function(item) {
        var actorTypePrefix = 'http://ldf.fi/warsa/actors/actor_types/';

        actorService.getActorInfo(item.participant_id).then(function(participants) {
            self.current.commanders = [];
            self.current.units = [];
            var setActor = function(actor) {
                if (actor.type === actorTypePrefix + 'MilitaryPerson') {
                    self.current.commanders.push(actor);
                } else if (actor.type === actorTypePrefix + 'MilitaryUnit') {
                    self.current.units.push(actor);
                }
            };
            if (_.isArray(participants)) {
                participants.forEach(function(p) {
                    setActor(p);
                });
            } else if (participants) {
                setActor(participants);
            }
        });
    };

    var fetchImages = function(item) {
        self.isLoadingImages = true;
        var photoConfig = Settings.getPhotoConfig();
        console.log(photoConfig);
        self.images = [];
        photoService.getRelatedPhotosForEvent(item.opts.event, photoConfig).then(function(imgs) {
            self.images = imgs;
            self.isLoadingImages = false;
        });
    };

    self.updateTimeline = function() {
        self.current = undefined;
        self.images = [];

        self.visualize();
    };

    var getCasualtyLocations = function() {
        var band = tm.timeline.getBand(1);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        return casualtyService.getCasualtyLocationsByTime(start.toISODateString(), end.toISODateString())
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
        casualtyService.getCasualtyCountsByTimeGroupByType(start.toISODateString(), end.toISODateString())
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
        fetchRelatedPeople(item.opts.event);
        fetchImages(item);
    };

    var onMouseUpListener = function() {
        heatmapListener();
        getCasualtyCount();
    };

    self.createTimeMap = function(start, end, highlights) {

        var photoConfig = Settings.getPhotoConfig();

        return timemapService.createTimemapByTimeSpan(start, end, highlights,
                infoWindowCallback, photoConfig)
        .then(function(timemap) {
            tm = timemap;
            map = timemap.getNativeMap();
            var band = tm.timeline.getBand(1);

            getCasualtyCount();
            timemapService.setOnMouseUpListener(onMouseUpListener);
            band.addOnScrollListener(clearHeatmap);
            getCasualtyLocations().then(function(locations) {
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: locations,
                    radius: 20
                });
                Settings.setHeatmapUpdater(self.updateHeatmap);
                self.updateHeatmap();
            });
        });
    };

    var worldWarHighlight = {
        startDate: "1939-09-01",
        endDate: "1945-09-02",
        color:      "#F2F2F2",
        opacity:    20,
        startLabel: "Toinen maailmansota",
        endLabel:   "",
        cssClass: "band-highlight"
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
        return self.createTimeMap(winterWarTimeSpan.start, winterWarTimeSpan.end, winterWarHighlights);
    };
    self.showContinuationWar = function() {
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
        show().then(function() {
            var item = _.find(tm.getItems(), function(item) {
                return _.isEqual(item.opts.event.id, e.id);
            });
            self.current = item;
            tm.timeline.getBand(1).setCenterVisibleDate(new Date(e.start_time));
            tm.setSelected(item);
            item.openInfoWindow();
        });
    };

    self.visualize = function() {

        var era = $routeParams.era;
        var event_uri = $routeParams.uri;
        if (event_uri) {
            return eventService.getEventById(event_uri).then(function(e) {
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
                    return self.showWinterWar();
                }
                case 'continuationwar': {
                    return self.showContinuationWar();
                }
            }
        }
        $location.path('events/winterwar').replace();
        return self.showWinterWar();
    };

    self.visualize();

});
