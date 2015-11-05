'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SemanticPageCtrl', function($routeParams, $q, $rootScope, semanticModelService) {
    $rootScope.showSettings = null;
    $rootScope.showHelp = null;
    var self = this;
    if ($routeParams.uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = true;
        semanticModelService.getById($routeParams.uri)
        .then(function(semanticModel) {
            self.obj = semanticModel; 
            self.isLoadingEvent = false;
            return $q.when();
        }).then(function() {
            return self.obj.fetchRelated();
        }).then(function() {
            self.isLoadingLinks = false;
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    }
});
