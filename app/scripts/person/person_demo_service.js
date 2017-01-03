(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .factory('PersonDemoService', PersonDemoService);

    /* @ngInject */
    function PersonDemoService($q, $location, _, EventDemoService, eventService,
            timemapService, personService, Settings, WAR_INFO) {

        PersonDemoServiceConstructor.prototype.createTimemap = createTimemapByActor;
        PersonDemoServiceConstructor.prototype.getEventTypes = getEventTypes;
        PersonDemoServiceConstructor.prototype.getTimelineEvents = getTimelineEvents;

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
            this.current = item;
            $location.search('event', item.opts.event.id);
            eventService.fetchRelated(item.opts.event);
            this.fetchImages(item);
        }

        function getTimelineEvents(person, options) {
            options = options || {};
            var types = _.filter(options.types, 'selected');
            if (types.length === 0) {
                return $q.reject('NO_EVENTS');
            }
            var opts = {
                types: types,
                includeUnitEvents: options.includeUnitEvents
            };
            return personService.fetchTimelineEvents(person, opts);
        }

        function createTimemapByActor(person) {
            var self = this;

            var photoConfig = Settings.getPhotoConfig();
            var start = WAR_INFO.winterWarTimeSpan.start;
            var end = WAR_INFO.continuationWarTimeSpan.end;

            self.current = undefined;
            self.currentPersonId = person.id;
            self.highlights = WAR_INFO.winterWarHighlights.concat(WAR_INFO.continuationWarHighlights);

            var bandInfo = timemapService.getDefaultBandInfo(start, end, self.highlights);
            bandInfo[0].intervalPixels = 50;
            bandInfo[1].intervalPixels = 50;

            return timemapService.createTimemapWithPhotoHighlight(
                start, end, person.timelineEvents, self.highlights, self.infoWindowCallback,
                photoConfig, bandInfo, self.tm)
            .then(function(timemap) {
                var isNew = !self.tm;
                self.tm = timemap;
                self.map = timemap.getNativeMap();

                if (isNew) {
                    self.setupTimemap();
                }
                return self.navigateToEarliestEvent();
            }).catch(function(data) {
                return $q.reject(data);
            });
        }

        function getEventTypes(person, oldTypes) {
            var opts = {
                start: WAR_INFO.winterWarTimeSpan.start,
                end: WAR_INFO.continuationWarTimeSpan.end
            };
            return personService.getEventTypes(person, opts)
            .then(function(types) {
                types.forEach(function(t) {
                    var old = _.find(oldTypes, ['id', t.id]) || {};
                    t.selected = old.selected === false ? false : true;
                });
                return types;
            });
        }
    }
})();
