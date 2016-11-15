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
        self.getByThemeId = getByThemeId;
        self.getMinimalDataWithPlaceByTimeSpan = getMinimalDataWithPlaceByTimeSpan;
        self.getMinimalDataByTimeSpan = getMinimalDataByTimeSpan;
        self.getByFacetSelections = getByFacetSelections;

        /* Implementation */

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, photoMapperService);

        var minimalDataService = new AdvancedSparqlService(ENDPOINT_CONFIG, objectMapperService);

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX wph: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX wat: <http://ldf.fi/warsa/actors/actor_types/> ' +
        ' PREFIX dctype: <http://purl.org/dc/dcmitype/> ' +
        ' PREFIX dc: <http://purl.org/dc/terms/> ' +
        ' PREFIX text: <http://jena.apache.org/text#> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var select =
        ' SELECT DISTINCT ?id ?url ?thumbnail_url ?description ?created ' +
        '  ?participant_id ?unit_id ?place_id ?place_string ' +
        '  ?source ?creator_id ?photographer_string ?theme ';

        var photosByPlaceAndTimeResultSet =
        ' VALUES ?place_id { <ID> } ' +
        ' ?id ^crm:P94_has_created [ ' +
        '  crm:P7_took_place_at ?place_id ; ' +
        '  crm:P4_has_time-span/crm:P82a_begin_of_the_begin ?created ' +
        ' ] . ' +
        ' ?id a wph:Photograph . ' +
        ' FILTER(?created >= "<START>"^^xsd:date && ?created <= "<END>"^^xsd:date) ';

        var photoQry = select +
        ' { ' +
        '  <RESULT_SET> ' +
        '  ?id sch:contentUrl ?url ; ' +
        '    sch:thumbnailUrl ?thumbnail_url . ' +
        '  OPTIONAL { ?id dc:description ?description . } ' +
        '  OPTIONAL { ?id wph:theme ?theme . } ' +
        '  OPTIONAL { ' +
        '   ?id ^crm:P94_has_created ?event_id . ' +
        '   OPTIONAL { ?event_id crm:P4_has_time-span/crm:P82a_begin_of_the_begin ?created . } ' +
        '   OPTIONAL { ?event_id crm:P14_carried_out_by ?creator_id . } ' +
        '   OPTIONAL { ?event_id crm:P7_took_place_at ?place_id . } ' +
        '   OPTIONAL { ' +
        '    ?event_id crm:P11_had_participant ?unit_id . ' +
        '    ?unit_id a wat:MilitaryUnit . ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    ?event_id crm:P11_had_participant ?participant_id . ' +
        '    ?participant_id a/rdfs:subClassOf* crm:E21_Person . ' +
        '   } ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id dc:source ?source_id . ' +
        '   ?source_id skos:prefLabel ?source . ' +
        '   FILTER(langMatches(lang(?source), "fi")) ' +
        '  } ' +
        '  OPTIONAL { ?id wph:place_string ?place_string . } ' +
        '  OPTIONAL { ?id wph:photographer_string ?photographer_string . } ' +
        ' } ';

        var singlePhotoQryResultSet =
        '  BIND(<{0}> AS ?id) ' +
        '  ?id sch:contentUrl ?url . ';

        var photosByThemeResultSet =
        '  BIND("<VAL>" AS ?theme) ' +
        '  ?id wph:theme ?theme . ';

        var photosByTimeResultSet =
        ' ?id ^crm:P94_has_created/crm:P4_has_time-span/crm:P82a_begin_of_the_begin ?created . ' +
        ' FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        ' ?id a wph:Photograph . ';

        var photosByUnitResultSet =
        ' VALUES ?unit_id { {0} } ' +
        ' ?id ^crm:P94_has_created/crm:P11_had_participant ?unit_id . ' +
        ' ?id a wph:Photograph . ';

        var photosByPersonResultSet =
        ' VALUES ?participant_id { {0} } ' +
        ' { ?id ^crm:P94_has_created/crm:P11_had_participant ?participant_id . } ' +
        ' UNION ' +
        ' { ?id ^crm:P94_has_created/crm:P14_carried_out_by ?participant_id . } ' +
        ' ?id a wph:Photograph . ';

        var minimalPhotosWithPlaceByTimeQry = prefixes +
        ' SELECT DISTINCT ?created ?place_id WHERE { ' +
        '   ?id ^crm:P94_has_created [ ' +
        '    crm:P7_took_place_at ?place_id ; ' +
        '    crm:P4_has_time-span/crm:P82a_begin_of_the_begin ?created ' +
        '   ] . ' +
        '   ?id a wph:Photograph . ' +
        '   FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        ' } ' +
        ' ORDER BY ?created ';

        var minimalPhotosByTimeQry = prefixes +
        ' SELECT DISTINCT ?created' +
        ' WHERE { ' +
        '  ?id ^crm:P94_has_created/crm:P4_has_time-span/crm:P82a_begin_of_the_begin ?created . ' +
        '  FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        '  ?id a wph:Photograph . ' +
        ' } ' +
        ' ORDER BY ?created ';

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
            var resultSet = facetSelections.join(' ');
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet, 'DESC(?score) ?id');
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

        function getByThemeId(id, pageSize) {
            var resultSet = photosByThemeResultSet.replace(/<VAL>/g, id);
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
