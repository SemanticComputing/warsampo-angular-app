(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('SemanticPageController', function($transition$, $rootScope, _, semanticModelService) {
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

        self.uri = $transition$.params().uri;

        if (self.uri) {
            self.isLoadingObject = true;
            self.isLoadingLinks = true;
            semanticModelService.getById(self.uri)
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
