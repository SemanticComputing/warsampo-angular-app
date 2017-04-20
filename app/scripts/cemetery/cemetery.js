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
    function cemeteryService($q, _, baseService, cemeteryRepository, photoRepository, Settings) {
        var self = this;

        /* Public API */

        self.getSingleCemeteryById = getSingleCemeteryById;
        self.getCemeteriesByPlaceId = getCemeteriesByPlaceId;

        self.fetchRelated = fetchRelated;
        self.fetchPeople = fetchPeople;
        self.fetchRelatedPhotos = fetchRelatedPhotos;

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
                self.fetchRelatedPhotos(cemetery)
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
            return cemeteryRepository.getRelatedPersons(cemetery.id, Settings.pageSize)
            .then(function(data) {
                if (data) {
                    cemetery.relatedPersons = data;
                    cemetery.hasLinks = true;
                  }
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
        * @name eventsApp.ce  this.getRelatedPersons = function(id, pageSize) {
            id = baseRepository.uriFy(id);
            var resultSet = relatedPersonQryResultSet.replace(/<ACTOR>/g, id);
            var qryObj = queryBuilder.buildQuery(personQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };meteryService#getSingleCemeteryById
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
})()
