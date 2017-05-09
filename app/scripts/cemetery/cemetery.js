(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /**
    * @ngdoc service
    * @name eventsApp.cemeteryService
    * @requires eventsApp.cemeteryRepository
    * @description
    * # cemeteryService
    * Service for fetching cemeteries and related information.
    */
    angular.module('eventsApp')
    .service('cemeteryService', cemeteryService);

    /* @ngInject */
    function cemeteryService($q, _, baseService, cemeteryRepository,
          personRepository, photoRepository, eventRepository, placeRepository,
          unitRepository, rankRepository, Settings) {
        var self = this;

        /* Public API */

        self.getSingleCemeteryById = getSingleCemeteryById;
        self.getCemeteriesByPlaceId = getCemeteriesByPlaceId;

        self.fetchRelated = fetchRelated;
        self.fetchPeople = fetchPeople;
        self.fetchRelatedPhotos = fetchRelatedPhotos;
        self.fetchRelatedUnits = fetchRelatedUnits;

        /**
        * @ngdoc method
        * @methodOf eventsApp.cemeteryService
        * @name eventsApp.cemeteryService#fetchRelated
        * @description
        * Fetch related resources for the given cemetery.
        * @param {Object} cemetery The cemetery object for which to fetch related data.
        * @returns {promise} A promise of the modified cemetery object.
        */
        function fetchRelated(cemetery) {
            var related = [
                self.fetchPeople(cemetery),
                self.fetchRelatedPhotos(cemetery),
                self.fetchRelatedUnits(cemetery)
            ];
            return $q.all(related).then(function() {
                return cemetery;
            });
        }

        /**
        * @ngdoc method
        * @methodOf eventsApp.cemeteryService
        * @name eventsApp.cemeteryService#fetchPeople
        * @description
        * Fetch related people for the given cemetery.
        * @param {Object} cemetery The cemetery object for which to fetch related data.
        * @returns {promise} A promise of the modified cemetery object.
        */
        function fetchPeople(cemetery) {
              return personRepository.getById(cemetery.person_id, 10)
              .then(function(buriedPersons) {
                  cemetery.buriedPersonsPager = buriedPersons;
                  return buriedPersons.getAll();
              })
              .then(function(buriedPersons) {
                  cemetery.buriedPersons = buriedPersons;
                  return baseService.getRelated(buriedPersons, 'death_id', 'deathEvent', eventRepository); // return list of persons
              })
              .then(function(buriedPersons) {
                  return baseService.getRelated(buriedPersons, 'rank_id', 'rank', rankRepository); // return list of persons
              })
              .then(function(buriedPersons) {
                  return baseService.getRelated(buriedPersons, 'unit_id', 'unit', unitRepository); // return list of persons
              })
              .then(function(buriedPersons) {
                  var events = _.flatten(_.map(buriedPersons, 'deathEvent'));
                  return baseService.getRelated(events, 'place_id', 'place', placeRepository); // return list of events
              });
        }

        function fetchRelatedUnits(cemetery) {
            return unitRepository.getByCemeteryId(cemetery.id).then(function(units) {
                if (units && units.length) {
                    cemetery.units = units;
                    cemetery.hasLinks = true;
                }
                return cemetery;
            });
        }

        function fetchRelatedPhotos(cemetery) {
            return photoRepository.getByCemeteryId(cemetery.id, 50).then(function(imgs) {
                cemetery.images = imgs;
                return imgs.getTotalCount();
            }).then(function(count) {
                if (count) {
                    cemetery.hasLinks = true;
                }
                return cemetery;
            });
        }

        /**
        * @ngdoc method
        * @methodOf eventsApp.cemeteryService
        * @name eventsApp.cemeteryService#getSingleCemeteryById
        * @description
        * Get a single cemetery by its URI.
        * @param {string} id The URI cemetery resource.
        * @returns {promise} A promise of the cemetery object.
        */
        function getSingleCemeteryById(id) {
            return cemeteryRepository.getSingleById(id);
        }

        /**
        * @ngdoc method
        * @methodOf eventsApp.cemeteryService
        * @name eventsApp.cemeteryService#getCemeteriesByPlaceId
        * @description
        * Get cemeteries by place id.
        * @param {string|Array} ids The place URI(s).
        * @param {number} [pageSize] The page size.
        * @param {string|Array} [idFilter] The cemetery URI(s) to filter out of the results.
        * @returns {promise} A promise of the list of the query results as objects,
        *   or if pageSize was given, a promise of a `PagerService` instance.
        */

        function getCemeteriesByPlaceId(ids, pageSize, idFilter) {
            if (idFilter) {
                return cemeteryRepository.getByPlaceIdFilterById(ids, idFilter, pageSize);
            }
            return cemeteryRepository.getByPlaceId(ids, pageSize);
        }



    }
})();
