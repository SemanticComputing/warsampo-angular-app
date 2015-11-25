'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:RankPageCtrl
 * @description
 * # RankPageCtrl
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
            return rankService.fetchRelated(rank).then(function() {
                self.isLoadingPersons = false;
            });
        }).catch(function() {
            self.isLoadingRank = false;
            self.isLoadingPersons = false;
        });
    }
});


