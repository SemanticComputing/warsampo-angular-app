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
    $scope.photoDaysAfter = 4;
    $scope.photoPlace = true;
    var tm;

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

    $scope.createTimeMap = function(start, end) {
        tm = timemapService.createTimemap(start, end, fetchImages);
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
