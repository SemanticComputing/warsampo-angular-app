(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .factory('EventDemoService', EventDemoService);

    /* @ngInject */
    function EventDemoService($location, $q, _, timemapService, googleMapsService, Settings,
            eventService, photoService, casualtyRepository) {

        EventDemoServiceConstructor.prototype.getTimemap = getTimemap;
        EventDemoServiceConstructor.prototype.getMap = getMap;
        EventDemoServiceConstructor.prototype.getHeatmap = getHeatmap;
        EventDemoServiceConstructor.prototype.getCasualtyCount = getCasualtyCount;
        EventDemoServiceConstructor.prototype.getCasualtyStats = getCasualtyStats;
        EventDemoServiceConstructor.prototype.getCurrent = getCurrent;
        EventDemoServiceConstructor.prototype.getImages = getImages;

        EventDemoServiceConstructor.prototype.createTimemap = createTimemapByTimeSpan;
        EventDemoServiceConstructor.prototype.setupTimemap = setupTimemap;
        EventDemoServiceConstructor.prototype.refresh = refresh;
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
        EventDemoServiceConstructor.prototype.fetchImages = fetchImages;

        EventDemoServiceConstructor.prototype.cleanUp = cleanUp;

        return EventDemoServiceConstructor;

        function EventDemoServiceConstructor() {
            var self = this;
            self.tm;
            self.map;
            self.heatmap;
            self.highlights;
            self.casualtyCount;
            self.casualtyStats;
            self.current;
            self.images;

            self.infoWindowCallback = infoWindowCallback;

            function infoWindowCallback(item) {
                // Change the URL but don't reload the page
                if ($location.search().uri !== item.opts.event.id) {
                    $location.search('uri', item.opts.event.id);
                }

                self.current = item;
                eventService.fetchRelated(item.opts.event);
                self.fetchImages(item);
            }

        }

        function cleanUp() {
            if (this.tm) {
                this.tm.timeline.dispose();
            }
            return timemapService.cleanUp();
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

        function getCurrent() {
            if (this.current) {
                return this.current.opts.event;
            }
        }

        function getImages() {
            return this.images;
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
                self.setCenterVisibleDate(new Date(highlights[0].startDate));

                self.setupTimemap();
            });
        }

        function refresh() {
            var self = this;
            var promises = [self.calculateCasualties(), self.updateHeatmap()];
            return $q.all(promises);
        }

        function navigateToEvent(e) {
            var item = _.find(this.tm.getItems(), function(item) {
                return _.isEqual(item.opts.event.id, e.id);
            });
            this.setCenterVisibleDate(new Date(e.start_time));
            if (item) {
                this.tm.setSelected(item);
                item.openInfoWindow();
                return this.refresh();
            }
            return $q.reject('Event not found on timeline');
        }

        function setupTimemap() {
            var self = this;

            googleMapsService.normalizeMapZoom(self.map);

            self.setOnMouseUpListener(function() { self.onMouseUpListener(); });
            self.addOnScrollListener(function() { self.clearHeatmap(); });
            self.tm.timeline.setAutoWidth();
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
            return casualtyRepository.getCasualtyCountsByTimeGroupByType(dates.start, dates.end)
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

        function fetchImages(item) {
            var self = this;
            var photoConfig = Settings.getPhotoConfig();
            if (item.opts.event) {
                photoService.getRelatedPhotosForEvent(item.opts.event, photoConfig).then(function(imgs) {
                    self.images = imgs;
                });
            }
        }

    }
})();
