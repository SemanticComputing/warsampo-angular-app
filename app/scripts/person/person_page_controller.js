'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:UnitPageCtrl
 * @description
 * # UnitPageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('PersonPageCtrl', function($routeParams, $q, $rootScope, eventService, personService) {
    $rootScope.showSettings = null;
    $rootScope.showHelp = null;
    var self = this;
    if ($routeParams.uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = false;
        personService.getById($routeParams.uri)
        .then(function(person) {
            self.person = person; 
            self.isLoadingEvent = false;

            return personService.fetchRelated(person);
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    }
});


