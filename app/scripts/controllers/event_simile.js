'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # SimileMapCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SimileMapCtrl', function ($routeParams, $location, 
              $anchorScroll, $timeout, $window, $scope, $rootScope,
              eventService, photoService, casualtyService, actorService, timemapService) {

    var self = this;

    // The currently selected event
    self.current = undefined;
    // Images related to currently selected event
    self.images = undefined;
    // Current image page
    self.currentImages = [];
    self.currentImagePage = 1;
    self.imagePageSize = 1;
    self.photoDaysBefore = 1;
    self.photoDaysAfter = 3;
    self.photoPlace = true;
    self.showCasualtyHeatmap = true;
    self.showPhotos = false;
    var tm, map, heatmap;

    $rootScope.showHelp = function() {
        self.current = undefined;
    };

    self.settingsVisible = false;
    $rootScope.showSettings = function() {
        self.settingsVisible = !self.settingsVisible;
    };

    function changeDateAndFormat(date, days) {
        var d = new Date(date);
        d.setDate(d.getDate() + days);
        return formatDate(d);
    }

    function formatDate(date) {
        return date.toISOString().slice(0, 10);
    }

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

        self.images = [];
        self.currentImages = [];
        var place_ids;
        if (self.photoPlace) {
            place_ids = item.opts.place_uri;
            if (!place_ids) {
                self.currentImages = [];
                self.isLoadingImages = false;
                setTimeout(function(){ $scope.$apply(); });
                return;
            }
        }
        photoService.getPhotosByPlaceAndTimeSpan(place_ids, 
                changeDateAndFormat(item.start, -self.photoDaysBefore), 
                changeDateAndFormat(item.end, self.photoDaysAfter))
        .then(function(imgs) {
            self.isLoadingImages = false;
            imgs.forEach(function(img) {
                self.images.push(img);
            });
            self.currentImages = _.take(imgs, self.imagePageSize);
        });
    };

    self.fetchImages = function() {
        if (self.current) {
            fetchImages(self.current);
        }
    };

    self.imagePageChanged = function() {
        var start = (self.currentImagePage - 1) * self.imagePageSize;
        var end = start + self.imagePageSize;
        self.currentImages = self.images.slice(start, end);
    };

    var getCasualtyLocations = function() {
        var band = tm.timeline.getBand(0);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        return casualtyService.getCasualtyLocationsByTime(formatDate(start), formatDate(end))
            .then(function(casualties) {
                var res = [];
                casualties.forEach(function(casualty) {
                    var point = casualty.point.split(' ');
                    res.push(new google.maps.LatLng(parseFloat(point[0]), parseFloat(point[1])));
                });
                return res;
            });
    };

    var getCasualtyCount = function() {
        var band = tm.timeline.getBand(0);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        self.minVisibleDate = start;
        self.maxVisibleDate = end;
        casualtyService.getCasualtyCountsByTimeGroupByType(formatDate(start), formatDate(end))
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
        if (self.showCasualtyHeatmap) {
            getCasualtyLocations().then(function(locations) {
                heatmap.setData(locations);
                heatmap.setMap(map);
            });
        }
    };

    var clearHeatmap = function() {
        if (heatmap && (tm.timeline.getBand(0)._dragging || tm.timeline.getBand(1)._dragging)) {
            heatmap.setMap(null);
        }
    };

    self.updateHeatmap = function() {
        if (self.showCasualtyHeatmap) {
            heatmapListener();
        } else {
            heatmap.setMap(null);
        }
    };

    var onMouseUpListener = function() {
        heatmapListener();
        getCasualtyCount();
    };

    var infoWindowCallback = function(item) {
        item.opts = item.options;
        self.current = item;
        fetchRelatedPeople(item.opts.event);
        fetchImages(item);
    };

    var onScrollListener = function(band) {
        clearHeatmap();
    };

    self.createTimeMap = function(start, end, highlights) {
        timemapService.createTimemap(start, end, highlights, infoWindowCallback)
        .then(function(timemap) {
            tm = timemap;
            console.log(tm);
            map = timemap.map;
            //map.setOptions({ zoomControl: true });
            var band = tm.timeline.getBand(0);
            band.addOnScrollListener(onScrollListener);

            getCasualtyCount();
            timemapService.setOnMouseUpListener(onMouseUpListener);
            getCasualtyLocations().then(function(locations) {
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: locations,
                    radius: 20
                });
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

    self.showWinterWar = function() {
        self.createTimeMap('1939-07-01', '1940-04-30', winterWarHighlights);
    };
    self.showContinuationWar = function() {
        self.createTimeMap('1941-06-01', '1944-12-31', continuationWarHighlights);
    };

    if ($routeParams.era.toLowerCase() === 'continuationwar') {
        self.showContinuationWar();
    } else {
        self.showWinterWar();
    }

});
