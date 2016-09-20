(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('UnitPageCtrl', function($routeParams, $q, eventService, unitService) {
        var self = this;
        if ($routeParams.uri) {
            self.isLoadingEvent = true;
            self.isLoadingLinks = true;
            unitService.getById($routeParams.uri)
            .then(function(unit) {
                self.unit = unit;
                self.isLoadingEvent = false;
                return unitService.fetchRelated(unit).then(function() {
                    self.isLoadingLinks = false;
                });
            }).catch(function() {
                self.isLoadingEvent = false;
                self.isLoadingLinks = false;
            });
        }
    });
})();
