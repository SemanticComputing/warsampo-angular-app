'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('SemanticPageCtrl', function($routeParams, $q, $rootScope, _, semanticModelService) {
    $rootScope.showSettings = null;
    $rootScope.showHelp = null;
    var self = this;

    self.countRelations = function(obj) {
        var count = 0;
        _.forEach(_.values(obj.properties), function(vals) {
            count = count + vals.length;
        });
        return count;
    };

    self.getPropertyList = function(obj) {
        var list = [];
        _.forEach(_.values(obj.properties), function(vals) {
            list = list.concat(vals);
        });
        return list;
    };

    if ($routeParams.uri) {
        self.isLoadingObject = true;
        self.isLoadingLinks = true;
        semanticModelService.getById($routeParams.uri)
        .then(function(semanticModel) {
            self.obj = semanticModel;
            self.isLoadingObject = false;
            return semanticModelService.fetchRelated(self.obj);
        }).then(function() {
            self.isLoadingLinks = false;
        }).catch(function() {
            self.isLoadingObject = false;
            self.isLoadingLinks = false;
        });
    }
});
