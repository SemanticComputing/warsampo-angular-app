'use strict';

/*
 * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
    .service('photoService', function($q, photoRepository, dateUtilService) {

        this.getPhotosByPlaceAndTimeSpan = function(place_id, start, end) {
            if (place_id) {
                return photoRepository.getByPlaceAndTimeSpan(place_id, start, end);
            }
            return photoRepository.getByTimeSpan(start, end);
        };

        this.getDistinctPhotoData = function(start, end, getPlace) {
            // start and end as strings
            if (getPlace) {
                return photoRepository.getMinimalDataWithPlaceByTimeSpan(start, end);
            }
            return photoRepository.getMinimalDataByTimeSpan(start, end);
        };

        this.getRelatedPhotosForEvent = function(event, photoSettings) {
            var place_ids;
            if (photoSettings.inProximity) {
                place_ids = _.pluck(event.places, 'id');
                if (!place_ids) {
                    return $q.when();
                }
            }
            return this.getPhotosByPlaceAndTimeSpan(place_ids, 
                    dateUtilService.changeDateAndFormat(event.start_time, -photoSettings.beforeOffset), 
                    dateUtilService.changeDateAndFormat(event.end_time, photoSettings.afterOffset));
        };

        this.getByTimeSpan = function(start, end) {
            // start and end as strings
            return photoRepository.getByTimeSpan(start, end);
        };
});

