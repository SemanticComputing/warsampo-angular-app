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
    var tm, map, heatmap;

    function changeDateAndFormat(date, days) {
        var d = new Date(date);
        d.setDate(d.getDate() + days);
        return formatDate(d);
    }

    function formatDate(date) {
        return date.toISOString().slice(0, 10);
    }

    var fetchImages = function(item) {
        $scope.isLoadingImages = true;
        $scope.current = item;
        $scope.images = [];
        var place_ids;
        if ($scope.photoPlace) {
            place_ids = item.opts.place_uri;
        }

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
        return casualtyService.getCasualtyLocationsByTime(formatDate(band.getMinVisibleDate()), formatDate(band.getMaxVisibleDate()))
            .then(function(casualties) {
                var res = [];
                casualties.forEach(function(casualty) {
                    var point = casualty.point.split(' ');
                    res.push(new google.maps.LatLng(parseFloat(point[0]), parseFloat(point[1])));
                });
                return res;
            });
    };

    var heatmapListener = function() {
        getCasualtyLocations().then(function(locations) {
            heatmap.setData(locations);
            heatmap.setMap(map);
        });
    };

    var clearHeatmap = function() {
        heatmap.setMap(null);
    };

    $scope.createTimeMap = function(start, end) {
        timemapService.createTimemap(start, end, fetchImages)
        .then(function(timemap) {
            tm = timemap;
            map = timemap.getNativeMap();
            var band = tm.timeline.getBand(0);
            band.addOnScrollListener(clearHeatmap);

            getCasualtyLocations().then(function(locations) {
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: locations,
                        map: map
                });
            });
            timemapService.setOnMouseUpListener(heatmapListener);
        });
    };

    $scope.showWinterWar = function() {
        $scope.createTimeMap('1939-01-01', '1940-12-31');
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
