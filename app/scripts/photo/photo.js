(function() {
    'use strict';

    /*
    * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('photoService', function($q, _, photoRepository, dateUtilService,
            PHOTO_PAGE_SIZE) {

        var self = this;

        var defaultOptions = {
            pageSize: PHOTO_PAGE_SIZE,
            extended: false
        };

        self.getPhotosByPlaceAndTimeSpan = function(place_id, start, end, options) {
            if (place_id) {
                return photoRepository.getByPlaceAndTimeSpan(place_id, start, end, options);
            }
        };

        self.getByTimeSpan = function(start, end, options) {
            // start and end as strings
            var opts = angular.extend({}, defaultOptions, options);
            return photoRepository.getByTimeSpan(start, end, opts);
        };

        self.getDistinctPhotoData = function(start, end, getPlace) {
            // start and end as strings
            if (getPlace) {
                return photoRepository.getMinimalDataWithPlaceByTimeSpan(start, end);
            }
            return photoRepository.getMinimalDataByTimeSpan(start, end);
        };

        self.getRelatedPhotosForEvent = function(event, photoSettings) {
            var opts = angular.extend({}, defaultOptions, photoSettings);
            if (!(event.start_time && event.end_time)) {
                return $q.when();
            }
            var start = dateUtilService.changeDateAndFormat(event.start_time, -opts.beforeOffset);
            var end = dateUtilService.changeDateAndFormat(event.end_time, opts.afterOffset);
            var promise;
            if (opts.inProximity) {
                var place_ids = _.map(event.places, 'id');
                if (!place_ids) {
                    return $q.when();
                }
                promise = self.getPhotosByPlaceAndTimeSpan(place_ids, start, end, opts);
            } else {
                promise = self.getByTimeSpan(start, end, opts);
            }
            return promise.then(function(pager) {
                pager.pagesPerQuery = 1;
                return pager;
            });
        };
    });
})();
