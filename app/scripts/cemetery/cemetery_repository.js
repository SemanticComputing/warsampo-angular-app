(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /**
    * @ngdoc service
    * @name eventsApp.cemeteryRepository
    * @requires sparql.AdvancedSparqlService
    * @requires sparql.QueryBuilderService
    * @requires eventsApp.baseRepository
    * @description
    * # cemeteryRepository
    * Service for fetching cemetery data.
    */
    angular.module('eventsApp')
    .service('cemeteryRepository', cemeteryRepository);

    /* @ngInject */
    function cemeteryRepository($q, _, baseRepository, AdvancedSparqlService, QueryBuilderService,
            translateableObjectMapperService, ENDPOINT_CONFIG) {

        var self = this;

        /* Public API */

        self.getSingleById = getSingleById;
        self.getByPlaceId = getByPlaceId;
        self.getByPlaceIdFilterById = getByPlaceIdFilterById;

        /* Implementation */

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, translateableObjectMapperService);

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
        ' PREFIX nsc: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var orderBy = '?label';

        var select =
        ' SELECT DISTINCT ?id ?type ?type_id ?label ?place_id ';

        var baseResultSet =
        ' ?id a nsc:Hautausmaa . ' +
        ' ?id skos:prefLabel ?label . ';

        var singleResultSet =
            ' VALUES ?id { <ID> } ' +
            baseResultSet;

        var byPlaceQryResultSet =
        ' VALUES ?place_id { <ID> } ' +
        ' <FILTER> ' +
        ' ?id nsc:hautausmaakunta ?place_id . ' +
        baseResultSet;

        var cemeteryQry = select +
        ' { ' +
        '  <RESULT_SET> ' +
        '  OPTIONAL { ' +
        '   ?id a ?type_id . ' +
        '   ?type_id skos:prefLabel ?type . ' +
        '  } ' +
        '  OPTIONAL { ?id skos:prefLabel ?label . } ' +
        '  OPTIONAL { ?id nsc:hautausmaakunta ?place_id . } ' +
        ' } ';

        /**
        * @ngdoc method
        * @methodOf eventsApp.cemeteryRepository
        * @name eventsApp.cemeteryRepository#getSingleById
        * @description
        * Get a single cemetery by its URI.
        * @param {string} id The URI cemetery resource.
        * @returns {promise} A promise of the cemetery object.
        */
        function getSingleById(id) {
            if (!id) {
                return $q.when();
            }
            if (_.isArray(id) && id.length > 1) {
                $q.reject('Expected a single URI');
            }
            var resultSet = singleResultSet.replace('<ID>', baseRepository.uriFy(id));
            var qryObj = queryBuilder.buildQuery(cemeteryQry, resultSet);
            return endpoint.getObjects(qryObj.query).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Not found');
            });
        }

        /**
        * @ngdoc method
        * @methodOf eventsApp.cemeteryRepository
        * @name eventsApp.cemeteryRepository#getByPlaceId
        * @description
        * Get cemeteries by place (municipality) URI.
        * @param {string|Array} id The place URI(s).
        * @param {number} [pageSize] The page size.
        * @returns {promise} A promise of the list of the query results as objects,
        *   or if pageSize was given, a promise of a `PagerService` instance.
        */
        function getByPlaceId(id, pageSize) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = byPlaceQryResultSet
                .replace('<ID>', id)
                .replace('<FILTER>', '');
            var qryObj = queryBuilder.buildQuery(cemeteryQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        /**
        * @ngdoc method
        * @methodOf eventsApp.cemeteryRepository
        * @name eventsApp.cemeteryRepository#getByPlaceId
        * @description
        * Get cemeteries by place (municipality) URI, except for the cemeteries
        * given.
        * @param {string|Array} placeIds URI(s) of the of the place(s).
        * @param {string|Array} id The cemetery URI(s) to filter.
        * @param {number} [pageSize] The page size.
        * @returns {promise} A promise of the list of the query results as objects,
        *   or if pageSize was given, a promise of a `PagerService` instance.
        */
        function getByPlaceIdFilterById(placeIds, id, pageSize) {
            placeIds = baseRepository.uriFy(placeIds);
            id = baseRepository.uriFy(id);
            if (!(id && placeIds)) {
                return $q.when();
            }
            var filter = 'FILTER(?id != ' + id + ')';
            var resultSet = byPlaceQryResultSet
                .replace('<ID>', placeIds)
                .replace('<FILTER>', filter);
            var qryObj = queryBuilder.buildQuery(cemeteryQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }
    }
})();
