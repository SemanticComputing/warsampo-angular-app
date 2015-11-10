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
        self.isLoadingRank = true;
        self.isLoadingPersons = false;
        rankService.getById($routeParams.uri)
        .then(function(rank) {
            self.rank = rank; 
            self.isLoadingRank = false;
				self.isLoadingPersons = true;
            return rank.fetchRelated();
        }).catch(function() {
            self.isLoadingRank = false;
            self.isLoadingPersons = false;
        });
    }
});


