(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .factory('UnitDemoService', UnitDemoService);

    /* @ngInject */
    function UnitDemoService($q, $location, EventDemoService, eventService, timemapService, Settings, casualtyRepository) {

        UnitDemoServiceConstructor.prototype.createTimemap = createTimemapByActor;
        UnitDemoServiceConstructor.prototype.calculateCasualties = calculateCasualties;
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
            self.casualtyCount;
            self.casualtyStats;
            self.images;
            self.current;
            self.currentUnitId;

            self.infoWindowCallback = infoWindowCallback;

            function infoWindowCallback(item) {
                // Change the URL but don't reload the page
                $location.search('event', item.opts.event.id);
                self.current = item;
                eventService.fetchRelated(item.opts.event);
                self.fetchImages(item);
            }

        }

        function createTimemapByActor(id, start, end, highlights) {
            var self = this;
            self.current = undefined;
            self.currentUnitId = id;
            self.highlights = highlights;
            var photoConfig = Settings.getPhotoConfig();
            return timemapService.createTimemapByActor(id, start, end, highlights,
                self.infoWindowCallback, photoConfig, self.tm)
            .then(function(timemap) {
                var isNew = !self.tm;
                self.tm = timemap;
                self.map = timemap.getNativeMap();

                if (isNew) {
                    return self.setupTimemap();
                }
                return self.navigateToEarliestEvent();
            }).catch(function(data) {
                return $q.reject(data);
            });
        }

        function calculateCasualties() {
            var self = this;
            var dates = self.getVisibleDateRange();
            return casualtyRepository.getCasualtyCountsByTimeGroupByUnitAndType(dates.start.toISODateString(),
                    dates.end.toISODateString(), self.currentUnitId)
            .then(function(counts) {
                self.casualtyStats = counts;
                var count = 0;
                counts.forEach(function(type) {
                    count += parseInt(type.count);
                });
                self.casualtyCount = count;
                return { stats: counts, total: count };
            });
        }

        function getCasualtyLocations() {
            var self = this;
            var dates = self.getVisibleDateRange();
            return casualtyRepository.getCasualtyLocationsByTimeAndUnit(dates.start.toISODateString(),
                    dates.end.toISODateString(), self.currentUnitId);
        }
    }
})();
