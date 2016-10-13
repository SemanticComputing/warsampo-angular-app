(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('photoRepository', photoRepository);

    /* @ngInject */
    function photoRepository($q, _, baseRepository, AdvancedSparqlService,
                objectMapperService, photoMapperService, QueryBuilderService,
                ENDPOINT_CONFIG) {

        var self = this;

        /* Public API */

        self.getById = getById;
        self.getByTimeSpan = getByTimeSpan;
        self.getByPlaceAndTimeSpan = getByPlaceAndTimeSpan;
        self.getByPersonId = getByPersonId;
        self.getByUnitId = getByUnitId;
        self.getMinimalDataWithPlaceByTimeSpan = getMinimalDataWithPlaceByTimeSpan;
        self.getMinimalDataByTimeSpan = getMinimalDataByTimeSpan;
        self.getByFacetSelections = getByFacetSelections;

        /* Implementation */

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, photoMapperService);

        var minimalDataService = new AdvancedSparqlService(ENDPOINT_CONFIG, objectMapperService);

        var prefixes =
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX dctype: <http://purl.org/dc/dcmitype/> ' +
        ' PREFIX dc: <http://purl.org/dc/terms/> ' +
        ' PREFIX text: <http://jena.apache.org/text#> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var select =
        ' SELECT DISTINCT ?id ?url ?thumbnail_url ?description ?created ' +
        '  ?participant_id ?unit_id ?municipality_id ?place_id ?places__label ?places__point__lat ?places__point__lon ?places_string ' +
        '  ?source ?creator_id ?photographer_string ';

        var photosByPlaceAndTimeResultSet =
        ' VALUES ?place_id { <ID> } ' +
        ' ?id dc:spatial ?place_id  . ' +
        ' ?id dc:created ?created . ' +
        ' ?id a photos:Photograph . ' +
        ' FILTER(?created >= "<START>"^^xsd:date && ?created <= "<END>"^^xsd:date) ';

        var photoQry = select +
        ' { ' +
        '  <RESULT_SET> ' +
        '  ?id sch:contentUrl ?url ; ' +
        '    sch:thumbnailUrl ?thumbnail_url . ' +
        '  OPTIONAL { ?id dc:description ?description . } ' +
        '  OPTIONAL { ?id dc:created ?created . } ' +
        '  OPTIONAL { ?id dc:subject ?participant_id . } ' +
        '  OPTIONAL { ?id photos:unit ?unit_id . } ' +
        '  OPTIONAL { ' +
        '   ?id dc:source ?source_id . ' +
        '   ?source_id skos:prefLabel ?source . ' +
        '   FILTER(langMatches(lang(?source), "fi")) ' +
        '  } ' +
        '  OPTIONAL { ?id dc:creator ?creator_id . } ' +
        '  OPTIONAL { ?id photos:place_string ?place_string . } ' +
        '  OPTIONAL { ?id photos:photographer_string ?photographer_string . } ' +
        '  OPTIONAL { ?id dc:spatial ?place_id . } ' +
        ' } ';

        photoQry = photoQry.replace('<PLACE>',
                'OPTIONAL { ?id dc:spatial ?place_id . }');

        var singlePhotoQryResultSet =
        ' GRAPH warsa:photographs { ' +
        '  BIND(<{0}> AS ?id) ' +
        '  ?id sch:contentUrl ?url . ' +
        ' } ';

        var photosByTimeResultSet =
        ' GRAPH warsa:photographs { ' +
        '  ?id dc:created ?created . ' +
        ' } ' +
        ' FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ';

        var photosByUnitResultSet =
        ' VALUES ?unit_id { {0} } ' +
        ' ?id photos:unit ?unit_id . ' +
        ' ?id a photos:Photograph . ';

        var photosByPersonResultSet =
        ' VALUES ?participant_id { {0} } ' +
        ' { ?id dc:subject ?participant_id . } ' +
        ' UNION ' +
        ' { ?id dc:creator ?participant_id . } ' +
        ' ?id a photos:Photograph . ';

        var minimalPhotosWithPlaceByTimeQry = prefixes +
        ' SELECT DISTINCT ?created ?place_id WHERE { ' +
        '  GRAPH warsa:photographs { ' +
        '   ?id dc:spatial ?place_id . ' +
        '   ?id dc:created ?created . ' +
        '   FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        '  } ' +
        ' } ' +
        ' ORDER BY ?created ';

        var minimalPhotosByTimeQry = prefixes +
        ' SELECT DISTINCT ?created' +
        ' WHERE { ' +
        '  GRAPH warsa:photographs { ' +
        '   ?id dc:created ?created . ' +
        '   FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        '  } ' +
        ' } ' +
        ' ORDER BY ?created ';

        var facetQryResultSet =
        '   {0} ' +
        '   ?s a photos:Photograph .' +
        '   BIND(?s AS ?id) ';

        /* API function implementations */

        function getById(id) {
            var resultSet = singlePhotoQryResultSet.format(id);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query).then(function(data) {
                if (data.length) {
                    return (data)[0];
                }
                return $q.reject('Does not exist');
            });
        }

        function getByFacetSelections(facetSelections, options) {
            var resultSet = facetQryResultSet.format(facetSelections);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize,
                    qryObj.resultSetQuery);
        }

        function getByTimeSpan(start, end, options) {
            var resultSet = photosByTimeResultSet.format(start, end);
            var query =  options.extended ? photoQry : photoQry;
            var qryObj = queryBuilder.buildQuery(query, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize,
                    qryObj.resultSetQuery);
        }

        function getByPlaceAndTimeSpan(placeId, start, end, options) {
            placeId = baseRepository.uriFy(placeId);
            if (!placeId) {
                return $q.when();
            }
            var resultSet = photosByPlaceAndTimeResultSet
                .replace('<ID>', placeId)
                .replace('<START>', start)
                .replace('<END>' , end);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getByPersonId(id, pageSize) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = photosByPersonResultSet.format(id);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getByUnitId(id, pageSize) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = photosByUnitResultSet.format(id);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getMinimalDataWithPlaceByTimeSpan(start, end) {
            // start and end as strings
            var qry = minimalPhotosWithPlaceByTimeQry.format(start, end);
            return minimalDataService.getObjectsNoGrouping(qry);
        }

        function getMinimalDataByTimeSpan(start, end) {
            // start and end as strings
            var qry = minimalPhotosByTimeQry.format(start, end);
            return minimalDataService.getObjectsNoGrouping(qry);
        }
    }
})();
