'use strict';

/*
 * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
.service('photoService', function($q, photoRepository, dateUtilService) {

    this.getPhotosByPlaceAndTimeSpan = function(place_id, start, end, pageSize) {
        if (place_id) {
            return photoRepository.getByPlaceAndTimeSpan(place_id, start, end, pageSize);
        }
    };

    this.getByTimeSpan = function(start, end, pageSize) {
        // start and end as strings
        return photoRepository.getByTimeSpan(start, end, pageSize);
    };

    this.getDistinctPhotoData = function(start, end, getPlace) {
        // start and end as strings
        if (getPlace) {
            return photoRepository.getMinimalDataWithPlaceByTimeSpan(start, end);
        }
        return photoRepository.getMinimalDataByTimeSpan(start, end);
    };

    this.getRelatedPhotosForEvent = function(event, photoSettings) {
        var start = dateUtilService.changeDateAndFormat(event.start_time, -photoSettings.beforeOffset);
        var end = dateUtilService.changeDateAndFormat(event.end_time, photoSettings.afterOffset);
        if (photoSettings.inProximity) {
            var place_ids = _.pluck(event.places, 'id');
            if (!place_ids) {
                return $q.when();
            }
            return this.getPhotosByPlaceAndTimeSpan(place_ids, start, end, 20);
        }
        return this.getByTimeSpan(start, end, 20);
    };
});

