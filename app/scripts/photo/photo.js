(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('photoService', photoService);

    /* @ngInject */
    function photoService($q, _, photoRepository, personRepository, eventRepository,
            unitRepository, dateUtilService, PHOTO_PAGE_SIZE) {

        var self = this;

        var defaultOptions = {
            pageSize: PHOTO_PAGE_SIZE,
            extended: false
        };

        self.fetchPeople = fetchPeople;
        self.fetchUnits = fetchUnits;
        self.fetchRelated = fetchRelated;
        self.getPhotosByPlaceAndTimeSpan = getPhotosByPlaceAndTimeSpan;
        self.getByTimeSpan = getByTimeSpan;
        self.getDistinctPhotoData = getDistinctPhotoData;
        self.getRelatedPhotosForEvent = getRelatedPhotosForEvent;
        self.getById = getById;


        function fetchRelated(photo) {
            var related = [
                self.fetchPeople(photo),
                self.fetchUnits(photo)
            ];
            return $q.all(related).then(function() {
                return photo;
            });
        }

        function fetchUnits(photo) {
            return unitRepository.getByIdList(photo.unit_id)
            .then(function(units) {
                if (units && units.length) {
                    photo.units = units;
                    photo.hasLinks = true;
                }
                return photo;
            });
        }

        function fetchPeople(photo) {
            var people = [
                personRepository.getByIdList(photo.creator_id),
                personRepository.getByIdList(photo.participant_id)
            ];
            return $q.all(people)
            .then(function(people) {
                var creators = people[0];
                var participants = people[1];
                if (participants && participants.length) {
                    photo.people = participants;
                    photo.hasLinks = true;
                }
                if (creators && creators.length) {
                    photo.creators = creators;
                    photo.hasLinks = true;
                }
                return photo;
            });
        }

        function getById(id) {
            return photoRepository.getById(id);
        }

        function getPhotosByPlaceAndTimeSpan(place_id, start, end, options) {
            if (place_id) {
                return photoRepository.getByPlaceAndTimeSpan(place_id, start, end, options);
            }
        }

        function getByTimeSpan(start, end, options) {
            // start and end as strings
            var opts = angular.extend({}, defaultOptions, options);
            return photoRepository.getByTimeSpan(start, end, opts);
        }

        function getDistinctPhotoData(start, end, getPlace) {
            // start and end as strings
            if (getPlace) {
                return photoRepository.getMinimalDataWithPlaceByTimeSpan(start, end);
            }
            return photoRepository.getMinimalDataByTimeSpan(start, end);
        }

        function getRelatedPhotosForEvent(event, photoSettings) {
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
        }
    }
})();
