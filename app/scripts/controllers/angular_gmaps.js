'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # AngularGMapsCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('AngularGMapsCtrl', function($scope, uiGmapGoogleMapApi) {
    // Do stuff with your $scope.
    // Note: Some of the directives require at least something to be defined originally!
    // e.g. $scope.markers = []
    $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };

    // uiGmapGoogleMapApi is a promise.
    // The "then" callback function provides the google.maps object.
    uiGmapGoogleMapApi.then(function(maps) {
    });
});
