(function() {
    'use strict';

    /*
    * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('photoService', function($q, _, photoRepository, dateUtilService) {

        var self = this;

        self.getPhotosByPlaceAndTimeSpan = function(place_id, start, end, pageSize) {
            if (place_id) {
                return photoRepository.getByPlaceAndTimeSpan(place_id, start, end, pageSize);
            }
        };

        self.getByTimeSpan = function(start, end, pageSize) {
            // start and end as strings
            return photoRepository.getByTimeSpan(start, end, pageSize);
        };

        self.getDistinctPhotoData = function(start, end, getPlace) {
            // start and end as strings
            if (getPlace) {
                return photoRepository.getMinimalDataWithPlaceByTimeSpan(start, end);
            }
            return photoRepository.getMinimalDataByTimeSpan(start, end);
        };

        self.getRelatedPhotosForEvent = function(event, photoSettings) {
            if (!(event.start_time && event.end_time)) {
                return $q.when();
            }
            var start = dateUtilService.changeDateAndFormat(event.start_time, -photoSettings.beforeOffset);
            var end = dateUtilService.changeDateAndFormat(event.end_time, photoSettings.afterOffset);
            var promise;
            if (photoSettings.inProximity) {
                var place_ids = _.pluck(event.places, 'id');
                if (!place_ids) {
                    return $q.when();
                }
                promise = self.getPhotosByPlaceAndTimeSpan(place_ids, start, end, 50);
            } else {
                promise = self.getByTimeSpan(start, end, 50);
            }
            return promise.then(function(pager) {
                pager.pagesPerQuery = 1;
                return pager;
            });
        };
    });
})();
