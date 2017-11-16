(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('UnitPageController', function(unitService, uri) {
        var self = this;
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
