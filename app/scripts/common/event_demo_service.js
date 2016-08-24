(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .factory('EventDemoService', EventDemoService);

    /* @ngInject */
    function EventDemoService(_, timemapService, googleMapsService, Settings, casualtyRepository) {

        EventDemoServiceConstructor.prototype.getTimemap = getTimemap;
        EventDemoServiceConstructor.prototype.getMap = getMap;
        EventDemoServiceConstructor.prototype.getHeatmap = getHeatmap;
        EventDemoServiceConstructor.prototype.getCasualtyCount = getCasualtyCount;
        EventDemoServiceConstructor.prototype.getCasualtyStats = getCasualtyStats;

        EventDemoServiceConstructor.prototype.createTimemap = createTimemapByTimeSpan;
        EventDemoServiceConstructor.prototype.setupTimemap = setupTimemap;
        EventDemoServiceConstructor.prototype.calculateCasualties = calculateCasualties;
        EventDemoServiceConstructor.prototype.getCasualtyLocations = getCasualtyLocations;
        EventDemoServiceConstructor.prototype.updateHeatmap = updateHeatmap;
        EventDemoServiceConstructor.prototype.onMouseUpListener = onMouseUpListener;
        EventDemoServiceConstructor.prototype.clearHeatmap = clearHeatmap;
        EventDemoServiceConstructor.prototype.getMinVisibleDate = getMinVisibleDate;
        EventDemoServiceConstructor.prototype.getMaxVisibleDate = getMaxVisibleDate;
        EventDemoServiceConstructor.prototype.getVisibleDateRange = getVisibleDateRange;
        EventDemoServiceConstructor.prototype.navigateToEvent = navigateToEvent;
        EventDemoServiceConstructor.prototype.setCenterVisibleDate = setCenterVisibleDate;
        EventDemoServiceConstructor.prototype.addOnScrollListener = addOnScrollListener;
        EventDemoServiceConstructor.prototype.setOnMouseUpListener = setOnMouseUpListener;

        return EventDemoServiceConstructor;

        function EventDemoServiceConstructor(infoWindowCallback) {
            this.infoWindowCallback = infoWindowCallback;

            this.tm;
            this.map;
            this.heatmap;
            this.highlights;
            this.casualtyCount;
            this.casualtyStats;
        }

        function getTimemap() {
            return this.tm;
        }

        function getMap() {
            return this.map;
        }

        function getHeatmap() {
            return this.heatmap;
        }

        function getCasualtyCount() {
            return this.casualtyCount;
        }

        function getCasualtyStats() {
            return this.casualtyStats;
        }

        function setCenterVisibleDate(date) {
            timemapService.setCenterVisibleDate(this.tm, date);
        }

        function addOnScrollListener(fun) {
            timemapService.addOnScrollListener(this.tm, fun);
        }

        function setOnMouseUpListener(fun) {
            timemapService.setOnMouseUpListener(this.tm, fun);
        }

        function createTimemapByTimeSpan(start, end, highlights) {
            var self = this;
            var photoConfig = Settings.getPhotoConfig();
            return timemapService.createTimemapByTimeSpan(start, end, highlights,
                    self.infoWindowCallback, photoConfig)
            .then(function(timemap) {
                self.tm = timemap;
                self.map = timemap.getNativeMap();

                return self.setupTimemap(highlights);
            });
        }

        function navigateToEvent(e) {
            var item = _.find(this.tm.getItems(), function(item) {
                return _.isEqual(item.opts.event.id, e.id);
            });
            this.tm.timeline.getBand(1).setCenterVisibleDate(new Date(e.start_time));
            this.calculateCasualties();
            if (item) {
                this.tm.setSelected(item);
                item.openInfoWindow();
                return true;
            }
            return false;
        }

        function setupTimemap(highlights) {
            var self = this;

            googleMapsService.normalizeMapZoom(self.map);

            if (highlights) {
                self.setCenterVisibleDate(new Date(highlights[0].startDate));
            }

            self.calculateCasualties();
            self.setOnMouseUpListener(function() { self.onMouseUpListener(); });
            self.addOnScrollListener(function() { self.clearHeatmap(); });
            self.tm.timeline.setAutoWidth();
            self.updateHeatmap();
        }

        function getMinVisibleDate() {
            var tm = this.getTimemap();
            if (tm) {
                return this.getTimemap().timeline.getBand(1).getMinVisibleDate();
            }
        }

        function getMaxVisibleDate() {
            var tm = this.getTimemap();
            if (tm) {
                return this.getTimemap().timeline.getBand(1).getMaxVisibleDate();
            }
        }

        function getVisibleDateRange() {
            var tm = this.getTimemap();
            if (!tm) {
                return;
            }
            var band = tm.timeline.getBand(1);
            var start = band.getMinVisibleDate();
            var end = band.getMaxVisibleDate();

            return { start: start, end: end };
        }

        function calculateCasualties() {
            var self = this;
            var dates = self.getVisibleDateRange();
            return self.getCasualties(dates.start.toISODateString(),
                    dates.end.toISODateString())
            .then(function(counts) {
                self.casualtyStats = counts;
                var count = 0;
                counts.forEach(function(type) {
                    count += parseInt(type.count);
                });
                self.casualtyCount = count;
                return count;
            });
        }

        function getCasualtyLocations() {
            var dates = this.getVisibleDateRange();
            return casualtyRepository.getCasualtyLocationsByTime(dates.start.toISODateString(),
                    dates.end.toISODateString());
        }

        function updateHeatmap() {
            var self = this;
            if (Settings.showCasualtyHeatmap) {
                self.getCasualtyLocations().then(function(locations) {
                    if (!self.heatmap) {
                        self.heatmap = googleMapsService.createHeatmap();
                    }
                    googleMapsService.updateHeatmap(self.heatmap, locations, self.map);
                });
            } else {
                googleMapsService.clearHeatmap(self.heatmap);
            }
        }

        function clearHeatmap() {
            if (this.tm.timeline.getBand(0)._dragging || this.tm.timeline.getBand(1)._dragging) {
                googleMapsService.clearHeatmap(this.heatmap);
            }
        }

        function onMouseUpListener() {
            if (!(this.tm.timeline.getBand(0)._dragging || this.tm.timeline.getBand(1)._dragging)) {
                this.updateHeatmap();
                this.calculateCasualties();
            }
        }
    }
})();
