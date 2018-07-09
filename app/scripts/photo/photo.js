(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('photoService', photoService);

    /* @ngInject */
    function photoService($q, _, baseService, photoRepository, personRepository,
            eventRepository, unitRepository, placeRepository, dateUtilService, Settings, PHOTO_PAGE_SIZE) {

        var self = this;

        var defaultOptions = {
            pageSize: PHOTO_PAGE_SIZE,
            extended: false
        };

        self.fetchPeople = fetchPeople;
        self.fetchUnits = fetchUnits;
        self.fetchPlaces = fetchPlaces;
        self.fetchRelatedPhotos = fetchRelatedPhotos;
        self.fetchRelated = fetchRelated;
        self.getPhotosByPlaceAndTimeSpan = getPhotosByPlaceAndTimeSpan;
        self.getByTimeSpan = getByTimeSpan;
        self.getDistinctPhotoData = getDistinctPhotoData;
        self.getRelatedPhotosForEvent = getRelatedPhotosForEvent;
        self.getById = getById;
        self.getByPersonId = getByPersonId;


        function fetchRelated(photo) {
            var related = [
                self.fetchPeople(photo),
                self.fetchUnits(photo),
                self.fetchPlaces(photo)
            ];
            return $q.all(related).then(function() {
                return photo;
            });
        }

        function fetchRelatedPhotos(photo) {
            var opts = { pageSize: PHOTO_PAGE_SIZE };
            return photoRepository.getByThemeId(photo.theme, opts)
            .then(function(photos) {
                if (_.isEmpty(photos)) {
                    if (photo.created && photo.place_id) {
                        return photoRepository.getByPlaceAndTimeSpan(photo.place_id,
                            photo.created, photo.created, opts);
                    }
                }
                return photos;
            }).then(function(photos) {
                if (_.isEmpty(photos)) {
                    if (photo.created) {
                        return photoRepository.getByTimeSpan(photo.created, photo.created, opts);
                    }
                }
                return photos;
            }).then(function(photos) {
                photo.relatedPhotos = photos;
                return photo;
            });
        }

        function fetchPlaces(photo) {
            var placeUris = _(photo).castArray().map('place_id').flatten().compact().uniq().value();

            return placeRepository.getById(placeUris).then(function(places) {
                return baseService.combineRelated(photo, places, 'place_id', 'places');
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
            var promises = [
                personRepository.getByIdList(photo.creator_id),
                personRepository.getByIdList(photo.participant_id, { pageSize: Settings.pageSize })
            ];
            return $q.all(promises).then(function(people) {
                if (people[0]) {
                    photo.creators = people[0];
                    photo.hasLinks = true;
                }
                return people[1];
            }).then(function(people) {
                if (!people) {
                    return photo;
                }
                return people.getTotalCount().then(function(count) {
                    if (count) {
                        photo.peoplePager = people;
                        photo.hasLinks = true;
                        return people.getAll().then(function(people) {
                            photo.people = people;
                            return photo;
                        });
                    }
                    return photo;
                });
            });
        }

        function getById(id) {
            return photoRepository.getById(id);
        }

        function getPhotosByPlaceAndTimeSpan(place_id, start, end, options) {
            if (place_id) {
                return photoRepository.getByPlaceAndTimeSpan(place_id, start, end, options);
            }
            return $q.when();
        }

        function getByTimeSpan(start, end, options) {
            // start and end as strings
            var opts = angular.extend({}, defaultOptions, options);
            return photoRepository.getByTimeSpan(start, end, opts);
        }

        function getByPersonId(id, options) {
            var opts = angular.extend({}, defaultOptions, options);
            return photoRepository.getByPersonId(id, opts.pageSize);
        }

        function getDistinctPhotoData(start, end, getPlace) {
            // start and end as strings
            if (getPlace) {
                return photoRepository.getMinimalDataWithPlaceByTimeSpan(start, end)
                .then(function(photos) {
                    return self.fetchPlaces(photos);
                });
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
                promise = placeRepository.getNearbyPlaceIds(place_ids).then(function(ids) {
                    return photoRepository.getByIdUnionPlaceAndTimeSpan(event.photo_id, ids, start, end, opts);
                });
            } else {
                promise = photoRepository.getByIdUnionTimeSpan(event.photo_id, start, end, opts);
            }
            return promise.then(function(pager) {
                pager.pagesPerQuery = 1;
                return pager;
            });
        }
    }
})();
