'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:UnitPageCtrl
 * @description
 * # UnitPageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('RankPageCtrl', function($routeParams, $q, $rootScope, eventService, rankService) {
    $rootScope.showSettings = null;
    $rootScope.showHelp = null;
    var self = this;
    if ($routeParams.uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = false;
        rankService.getById($routeParams.uri)
        .then(function(rank) {
            self.rank = rank; 
            self.isLoadingEvent = false;

            return rank.fetchRelatedPersons();
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    }
});


