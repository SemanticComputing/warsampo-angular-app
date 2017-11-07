(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .factory('EventDemoService', EventDemoService);

    /* @ngInject */
    function EventDemoService($location, $timeout, $q, _, timemapService, googleMapsService, Settings,
            eventService, photoService, casualtyRepository, baseService) {

        EventDemoServiceConstructor.prototype.getTimemap = getTimemap;
        EventDemoServiceConstructor.prototype.getMap = getMap;
        EventDemoServiceConstructor.prototype.getHeatmap = getHeatmap;
        EventDemoServiceConstructor.prototype.getCasualtyCount = getCasualtyCount;
        EventDemoServiceConstructor.prototype.getCasualtyStats = getCasualtyStats;
        EventDemoServiceConstructor.prototype.getCurrent = getCurrent;
        EventDemoServiceConstructor.prototype.clearCurrent = clearCurrent;
        EventDemoServiceConstructor.prototype.clear = clear;
        EventDemoServiceConstructor.prototype.getImages = getImages;

        EventDemoServiceConstructor.prototype.getIdFromUri = baseService.getIdFromUri;

        EventDemoServiceConstructor.prototype.createTimemap = createTimemapByTimeSpan;
        EventDemoServiceConstructor.prototype.setupTimemap = setupTimemap;
        EventDemoServiceConstructor.prototype.refresh = refresh;
        EventDemoServiceConstructor.prototype.calculateCasualties = calculateCasualties;
        EventDemoServiceConstructor.prototype.getCasualtyLocations = getCasualtyLocations;
        EventDemoServiceConstructor.prototype.updateHeatmap = updateHeatmap;
        EventDemoServiceConstructor.prototype.clearHeatmap = clearHeatmap;
        EventDemoServiceConstructor.prototype.getMinVisibleDate = getMinVisibleDate;
        EventDemoServiceConstructor.prototype.getMaxVisibleDate = getMaxVisibleDate;
        EventDemoServiceConstructor.prototype.getVisibleDateRange = getVisibleDateRange;
        EventDemoServiceConstructor.prototype.scrollToDate = scrollToDate;
        EventDemoServiceConstructor.prototype.navigateTo = navigateTo;
        EventDemoServiceConstructor.prototype.navigateToEvent = navigateToEvent;
        EventDemoServiceConstructor.prototype.navigateToDate = navigateToDate;
        EventDemoServiceConstructor.prototype.navigateToEarliestEvent = navigateToEarliestEvent;
        EventDemoServiceConstructor.prototype.setCenterVisibleDate = setCenterVisibleDate;
        EventDemoServiceConstructor.prototype.addOnScrollListener = addOnScrollListener;
        EventDemoServiceConstructor.prototype.onMouseUpListener = onMouseUpListener;
        EventDemoServiceConstructor.prototype.setOnMouseUpListener = setOnMouseUpListener;
        EventDemoServiceConstructor.prototype.fetchImages = fetchImages;
        EventDemoServiceConstructor.prototype.infoWindowCallback = infoWindowCallback;

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

            self.infoWindowCallback = self.infoWindowCallback.bind(self);

        }

        function clear() {
            return timemapService.clear(this.tm);
        }

        function clearCurrent() {
            timemapService.clearSelection(this.current);
            this.current = undefined;
        }

        function infoWindowCallback(item) {
            // Change the URL but don't reload the page
            if ($location.search().uri !== item.opts.event.id) {
                $location.search('uri', item.opts.event.id);
            }

            this.current = item;
            eventService.fetchRelated(item.opts.event);
            this.fetchImages(item);
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
                self.navigateToDate(new Date(highlights[0].startDate));

                return self.setupTimemap();
            });
        }

        function refresh() {
            var self = this;
            if (self.tm) {
                var promises = [self.calculateCasualties(), self.updateHeatmap()];
                return $q.all(promises).then(function(res) {
                    self.tm.timeline.setAutoWidth();
                    return res;
                });
            }
            return $q.when();
        }

        function navigateTo(item) {
            if (item) {
                this.scrollToDate(item.getStart());
                this.tm.setSelected(item);
                item.openInfoWindow();
                return this.refresh();
            }
            return $q.reject('Event not found on timeline');
        }

        function navigateToEvent(e) {
            var id = angular.isString(e) ? e : e.id;

            var item = _.find(this.tm.getItems(), function(item) {
                return _.isEqual(item.opts.event.id, id);
            });
            if (item) {
                return this.navigateTo(item);
            }
            if (!e.start_time) {
                return $q.reject('Cannot navigate to event');
            }
            return this.navigateToDate(new Date(e.start_time));
        }

        function scrollToDate(date) {
            this.tm.scrollToDate(date);
            googleMapsService.normalizeMapZoom(this.map);
        }

        function navigateToDate(date) {
            this.scrollToDate(date);
            return this.refresh();
        }

        function navigateToEarliestEvent() {
            return this.navigateToDate('earliest');
        }

        function setupTimemap() {
            var self = this;

            googleMapsService.normalizeMapZoom(self.map);

            self.setOnMouseUpListener(function() { self.onMouseUpListener(); });
            self.addOnScrollListener(_.throttle(_.bind(self.clearHeatmap, self), 500));

            return true;
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
            return casualtyRepository.getCasualtyLocationsByTime(dates.start, dates.end);
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
