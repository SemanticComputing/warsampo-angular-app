(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .factory('PersonDemoService', PersonDemoService);

    /* @ngInject */
    function PersonDemoService($q, $location, EventDemoService, eventService,
            timemapService, Settings) {

        PersonDemoServiceConstructor.prototype.createTimemap = createTimemapByActor;

        PersonDemoServiceConstructor.prototype = angular.extend({}, EventDemoService.prototype,
            PersonDemoServiceConstructor.prototype);

        return PersonDemoServiceConstructor;

        function PersonDemoServiceConstructor() {
            var self = this;

            self.tm;
            self.map;
            self.heatmap;
            self.highlights;
            self.casualtyCount;
            self.casualtyStats;
            self.images;
            self.current;
            self.currentPersonId;

            self.infoWindowCallback = infoWindowCallback.bind(self);

        }

        function infoWindowCallback(item) {
            // Change the URL but don't reload the page
            $location.search('event', item.opts.event.id);
            this.current = item;
            eventService.fetchRelated(item.opts.event);
            this.fetchImages(item);
        }

        function createTimemapByActor(id, start, end, highlights) {
            var self = this;
            self.current = undefined;
            self.currentPersonId = id;
            self.highlights = highlights;
            var photoConfig = Settings.getPhotoConfig();

            return eventService.getEventsByActorId(id)
            .then(function(data) {
                return eventService.fetchPlaces(data);
            })
            .then(function(data) {
                var bandInfo = timemapService.getDefaultBandInfo(start, end, highlights);
                bandInfo[0].intervalPixels = 50;
                bandInfo[1].intervalPixels = 50;

                return timemapService.createTimemapWithPhotoHighlight(
                    start, end, data, highlights, self.infoWindowCallback,
                    photoConfig, bandInfo, self.tm);
            })
            .then(function(timemap) {
                var isNew = !self.tm;
                self.tm = timemap;
                self.map = timemap.getNativeMap();

                if (isNew) {
                    self.setupTimemap();
                    self.navigateToDate('1939-11-30');
                    return self.tm.timeline.setAutoWidth();
                }
                self.navigateToDate('1939-11-30');
            }).catch(function(data) {
                return $q.reject(data);
            });
        }
    }
})();
