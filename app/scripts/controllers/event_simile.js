'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # SimileMapCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SimileMapCtrl', function ($scope, $routeParams, eventService, photoService, casualtyService, timemapService) {
    $scope.images = undefined;
    $scope.photoDaysBefore = 1;
    $scope.photoDaysAfter = 3;
    $scope.photoPlace = true;
    $scope.showCasualtyHeatmap = false;
    var tm, map, heatmap;

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
                $scope.current.related_people = participants;
            });
        }
    };

    var fetchImages = function(item) {
        $scope.isLoadingImages = true;
        $scope.current = item;
        $scope.images = [];
        var place_ids;
        if ($scope.photoPlace) {
            place_ids = item.opts.place_uri;
        }
        
        fetchRelatedPeople(item.opts.event);
        $scope.isLoadingImages = true;
        photoService.getPhotosByPlaceAndTimeSpan(place_ids, 
                changeDateAndFormat(item.getStart(), -$scope.photoDaysBefore), 
                changeDateAndFormat(item.getEnd(), $scope.photoDaysAfter))
        .then(function(imgs) {
            $scope.isLoadingImages = false;
            imgs.forEach(function(img) {
                $scope.images.push(img);
            });
        });
    };

    $scope.fetchImages = function() {
        fetchImages($scope.current);
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
        $scope.minVisibleDate = start;
        $scope.maxVisibleDate = end;
        casualtyService.getCasualtyCountsByTimeGroupByType(formatDate(start), formatDate(end))
        .then(function(counts) {
            $scope.casualtyStats = counts;
            var count = 0;
            counts.forEach(function(type) {
                count += parseInt(type.count);
            });
            $scope.casualtyCount = count;
         });
    };

    var heatmapListener = function() {
        if ($scope.showCasualtyHeatmap) {
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

    $scope.updateHeatmap = function() {
        if ($scope.showCasualtyHeatmap) {
            heatmapListener();
        } else {
            heatmap.setMap(null);
        }
    };

    var onMouseUpListener = function() {
        heatmapListener();
        getCasualtyCount();
    };

    $scope.createTimeMap = function(start, end) {
        timemapService.createTimemap(start, end, fetchImages)
        .then(function(timemap) {
            tm = timemap;
            map = timemap.getNativeMap();
            var band = tm.timeline.getBand(0);

            getCasualtyCount();
            timemapService.setOnMouseUpListener(onMouseUpListener);
            band.addOnScrollListener(clearHeatmap);
            getCasualtyLocations().then(function(locations) {
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: locations,
                    radius: 20
                });
                $scope.updateHeatmap();
            });
        });
    };

    $scope.showWinterWar = function() {
        $scope.createTimeMap('1939-08-01', '1940-04-30');
    };
    $scope.showContinuationWar = function() {
        $scope.createTimeMap('1941-06-01', '1944-12-31');
    };

    if ($routeParams.era.toLowerCase() === 'continuationwar') {
        $scope.showContinuationWar();
    } else {
        $scope.showWinterWar();
    }

});
