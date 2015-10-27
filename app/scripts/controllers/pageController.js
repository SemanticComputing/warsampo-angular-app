'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('PageCtrl', function($routeParams, eventService) {
    var self = this;
    if ($routeParams.uri) {
        eventService.getEventById($routeParams.uri).then(function(event) {
            event.fetchRelated().then(function() {
                self.event = event || {};
            });
        });
    }
});
