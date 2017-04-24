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
        self.getRelatedPersons = getRelatedPersons;

        // test url: http://localhost:9000/fi/cemeteries/page?uri=http:%2F%2Fldf.fi%2Fwarsa%2Fplaces%2Fcemeteries%2Fh0003_1

        /* Implementation */

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, translateableObjectMapperService);

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX cemeteries: <http://ldf.fi/schema/warsa/places/cemeteries/>' +
        ' PREFIX cemeteries-schema: <http://ldf.fi/schema/warsa/cemeteries/> ' +
        ' PREFIX wgs84: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX nsc: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var orderBy = '?label';

        var singleSelect =
        ' SELECT DISTINCT ?id ?type ?type_id ?label ?place_id ?status ?cemetery_type ' +
        ' ?cemetery_id ?narc_name ?current_municipality ?former_municipality ' +
        ' ?camera_club ?architect ?number_of_graves ?date_of_foundation ' +
        ' ?memorial_unveiling_date ?memorial ?memorial_sculptor ' +
        ' ?lat ?long ?address ';

        var select =
        ' SELECT DISTINCT ?id ?label ';

        var baseResultSet =
        ' ?id a cemeteries:Cemetery . ' +
        ' ?id skos:prefLabel ?label . ';

        var singleResultSet =
            ' VALUES ?id { <ID> } ' +
            baseResultSet;

        var byPlaceQryResultSet =
        ' VALUES ?place_id { <ID> } ' +
        ' <FILTER> ' +
        ' ?id cemeteries:temporary_municipality ?place_id . ' +
        baseResultSet;

        var relatedPersonQryResultSet =
        '   VALUES ?cemetery { <CEMETERY> } ' +
        '   ?death_record crm:P70_documents ?id . ' +
        '   ?death_record nsc:hautausmaa ?cemetery . ';

        var relatedQry = select +
        ' { ' +
        '  <RESULT_SET> ' +
        '  ?id skos:prefLabel ?label . ' +
        ' } ';

        var singleCemeteryQry = singleSelect +
        ' { ' +
        '  <RESULT_SET> ' +
        '  ?id a ?type_id . ' +
        '  ?type_id skos:prefLabel ?type . ' +
        '  OPTIONAL { ?id skos:prefLabel ?label . } ' +
        '  OPTIONAL { ?id cemeteries:temporary_municipality ?place_id . } ' +
        '  OPTIONAL { ?id cemeteries-schema:status ?status . } ' +
        '  OPTIONAL { ?id cemeteries-schema:cemetery_type ?cemetery_type . } ' +
        '  OPTIONAL { ?id cemeteries-schema:cemetery_id ?cemetery_id . } ' +
        '  OPTIONAL { ?id cemeteries-schema:narc_name ?narc_name . } ' +
        '  OPTIONAL { ?id cemeteries-schema:current_municipality ?current_municipality . } ' +
        '  OPTIONAL { ?id cemeteries-schema:former_municipality ?former_municipality . } ' +
        '  OPTIONAL { ?id cemeteries-schema:camera_club ?camera_club . } ' +
        '  OPTIONAL { ?id cemeteries-schema:architect ?architect . } ' +
        '  OPTIONAL { ?id cemeteries-schema:number_of_graves ?number_of_graves . } ' +
        '  OPTIONAL { ?id cemeteries-schema:date_of_foundation ?date_of_foundation . } ' +
        '  OPTIONAL { ?id cemeteries-schema:memorial_unveiling_date ?memorial_unveiling_date . } ' +
        '  OPTIONAL { ?id cemeteries-schema:memorial ?memorial . } ' +
        '  OPTIONAL { ?id cemeteries-schema:memorial_sculptor ?memorial_sculptor . } ' +
        '  OPTIONAL { ?id wgs84:lat ?lat . } ' +
        '  OPTIONAL { ?id wgs84:long ?long . } ' +
        '  OPTIONAL { ?id cemeteries-schema:address ?address . } ' +
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
            var qryObj = queryBuilder.buildQuery(singleCemeteryQry, resultSet);
            // console.log("cemetery - getSingleById - query:");
            // console.log(qryObj.query);
            return endpoint.getObjects(qryObj.query).then(function(data) {
                if (data.length) {
                    // console.log(data[0]);
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
            var qryObj = queryBuilder.buildQuery(relatedQry, resultSet, orderBy);
            // console.log("cemetery - getByPlaceIdFilterById - query:");
            // console.log(qryObj.query);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        /**
        * @ngdoc method
        * @methodOf eventsApp.cemeteryRepository
        * @name eventsApp.cemeteryRepository#getRelatedPersons
        * @description
        * Get related persons
        * @param {string} id The URI cemetery resource.
        * @param {number} [pageSize] The page size.
        * @returns {promise} A promise of the list of the query results as objects,
        *   or if pageSize was given, a promise of a `PagerService` instance.
        */
        function getRelatedPersons(id, pageSize) {
            id = baseRepository.uriFy(id);
            var resultSet = relatedPersonQryResultSet.replace(/<CEMETERY>/g, id);
            var qryObj = queryBuilder.buildQuery(relatedQry, resultSet);
            // console.log("cemetery - getRelatedPersons - query:");
            // console.log(qryObj.query);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }


    }
})();
