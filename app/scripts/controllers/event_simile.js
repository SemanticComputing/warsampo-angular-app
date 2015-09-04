'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # SimileMapCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SimileMapCtrl', function ($scope, $routeParams, eventService, photoService, timemapService) {
    $scope.images = undefined;
    $scope.photoDaysBefore = 1;
    $scope.photoDaysAfter = 3;
    $scope.photoPlace = true;
    var tm, map, heatmap;

    function changeDateAndFormat(date, days) {
        var d = new Date(date);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
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

    var getVisibleMarkers = function(tm) {
        return _.reduce(tm.map.markers, function(result, marker) {
            if (marker.proprietary_marker && marker.proprietary_marker.visible) {
                result.push(new google.maps.LatLng(marker.location.lat, marker.location.lon));
            }
            return result;
        }, []);
    };

    $scope.createTimeMap = function(start, end) {
        timemapService.createTimemap(start, end, fetchImages)
        .then(function(timemap) {
            tm = timemap;
            map = timemap.getNativeMap();
            var band = tm.timeline.getBand(0);
            band.addOnScrollListener(function() {
                if (!heatmap) {
                    heatmap = new google.maps.visualization.HeatmapLayer({
                        data: getVisibleMarkers(tm),
                        map: map
                    });
                } else {
                    heatmap.setData(getVisibleMarkers(tm));
                }
            });
            console.log(tm);
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
