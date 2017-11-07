(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('SemanticPageController', function($route, $rootScope, _, semanticModelService) {
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

        if ($route.current.locals.uri) {
            self.uri = $route.current.locals.uri;
            self.isLoadingObject = true;
            self.isLoadingLinks = true;
            semanticModelService.getById($route.current.locals.uri)
            .then(function(semanticModel) {
                self.obj = semanticModel;
                self.isLoadingObject = false;
                return semanticModelService.fetchRelated(self.obj);
            }).then(function() {
                self.isLoadingLinks = false;
            }).catch(function(err) {
                self.isLoadingObject = false;
                self.isLoadingLinks = false;
                self.error = err;
            });
        }
    });
})();
