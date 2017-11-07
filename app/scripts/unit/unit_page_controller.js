(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('UnitPageController', function(_, $route, eventService, unitService) {
        var self = this;
        var uri = $route.current.locals.uri;
        if (uri) {
            self.isLoadingEvent = true;
            self.isLoadingLinks = true;
            unitService.getById(uri)
            .then(function(unit) {
                self.unit = unit;
                self.isLoadingEvent = false;
                return unitService.fetchRelated(unit, true).then(function() {
                    self.isLoadingLinks = false;
                });
            }).catch(function() {
                self.isLoadingEvent = false;
                self.isLoadingLinks = false;
            });
        }
    });
})();
