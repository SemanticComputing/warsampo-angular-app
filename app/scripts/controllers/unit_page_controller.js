'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:UnitPageCtrl
 * @description
 * # UnitPageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('UnitPageCtrl', function($routeParams, $q, $rootScope, eventService, unitService) {
    $rootScope.showSettings = null;
    $rootScope.showHelp = null;
    var self = this;
    if ($routeParams.uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = false;
        unitService.getById($routeParams.uri)
        .then(function(unit) {
            self.unit = unit; 
            self.isLoadingEvent = false;
				return unit.fetchRelated();
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    }
});
