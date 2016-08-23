(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .factory('UnitDemoService', UnitDemoService);

    /* @ngInject */
    function UnitDemoService(EventDemoService, timemapService, Settings, casualtyRepository) {

        UnitDemoServiceConstructor.prototype.createTimemap = createTimemapByActor;
        UnitDemoServiceConstructor.prototype.getCasualtyCount = getCasualtyCount;
        UnitDemoServiceConstructor.prototype.getCasualtyLocations = getCasualtyLocations;

        UnitDemoServiceConstructor.prototype = angular.extend({}, EventDemoService.prototype,
            UnitDemoServiceConstructor.prototype);

        return UnitDemoServiceConstructor;

        function UnitDemoServiceConstructor() {
            var self = this;

            self.tm;
            self.map;
            self.heatmap;
            self.highlights;
            self.currentUnitId;
        }

        function setCurrentUnit(unit) {
            self.currentUnitId = unit;
        }

        function createTimemapByActor(id, start, end, highlights) {
            self.currentUnitId = id;
            self.highlights = highlights;
            var photoConfig = Settings.getPhotoConfig();
            return timemapService.createTimemapByActor(id, start, end, highlights,
                    self.infoWindowCallback, photoConfig).then(self.setupTimemap);
        }

        function getCasualtyCount() {
            var dates = self.getVisibleDateRange();
            casualtyRepository.getCasualtyCountsByTimeGroupByType(dates.start.toISODateString(),
                    dates.end.toISODateString())
            .then(function(counts) {
                self.casualtyStats = counts;
                var count = 0;
                counts.forEach(function(type) {
                    count += parseInt(type.count);
                });
                self.casualtyCount = count;
            });
        }

        function getCasualtyLocations() {
            var dates = self.getVisibleDateRange();
            return casualtyRepository.getCasualtyLocationsByTimeAndUnit(dates.start.toISODateString(),
                    dates.end.toISODateString(), self.currentUnitId);
        }
    }
})();
