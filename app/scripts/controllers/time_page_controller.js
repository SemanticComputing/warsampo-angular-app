'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('TimePageCtrl', function($routeParams, $q, $rootScope, timeService,
              photoService) {
    $rootScope.showSettings = null;
    $rootScope.showHelp = null;
    var self = this;
    if ($routeParams.uri) {
        self.isLoadingObj = true;
        self.isLoadingLinks = true;
        timeService.getById($routeParams.uri)
        .then(function(time) {
            self.time = time; 
            self.isLoadingObj = false;

            return self.time.fetchRelated();
        }).then(function() {
            self.isLoadingLinks = false;
        }).catch(function() {
            self.isLoadingObj = false;
            self.isLoadingLinks = false;
        });
    }
});
