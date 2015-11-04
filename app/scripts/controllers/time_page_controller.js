'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('TimePageCtrl', function($routeParams, $q, $rootScope, timeService) {
    $rootScope.showSettings = null;
    $rootScope.showHelp = null;
    var self = this;
    if ($routeParams.uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = true;
        timeService.getById($routeParams.uri)
        .then(function(time) {
            self.time = time; 
            self.isLoadingEvent = false;

            return self.time.fetchRelated();
        }).then(function() {
            self.isLoadingLinks = false;
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    }
});
