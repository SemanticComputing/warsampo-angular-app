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
        self.getByIdList = getByIdList;
        self.getByTimeSpan = getByTimeSpan;
        self.getByPlaceAndTimeSpan = getByPlaceAndTimeSpan;
        self.getByIdUnionTimeSpan = getByIdUnionTimeSpan;
        self.getByIdUnionPlaceAndTimeSpan = getByIdUnionPlaceAndTimeSpan;
        self.getByPersonId = getByPersonId;
        self.getByCemeteryId = getByCemeteryId;
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
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX text: <http://jena.apache.org/text#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ' +
        ' PREFIX wevs: <http://ldf.fi/schema/warsa/events/> ' +
        ' PREFIX wphs: <http://ldf.fi/schema/warsa/photographs/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var select =
        ' SELECT DISTINCT ?id ?url ?thumbnail_url ?description ?note ?created ' +
        '  ?time_id ?period ?participant_id ?unit_id ?place_id ?place_string ' +
        '  ?source ?creator_id ?photographer_string ?theme ';

        var photoQry = select +
        ' { ' +
        '  <RESULT_SET> ' +
        '  ?id sch:contentUrl ?url ; ' +
        '    sch:thumbnailUrl ?thumbnail_url . ' +
        '  OPTIONAL { ?id dct:description ?description . } ' +
        '  OPTIONAL { ?id crm:P3_has_note ?note . } ' +
        '  OPTIONAL { ?id wphs:theme ?theme . } ' +
        '  OPTIONAL { ' +
        '   ?id ^crm:P94_has_created ?event_id . ' +
        '   OPTIONAL { ?event_id wevs:related_period/skos:prefLabel ?period . } ' +
        '   OPTIONAL { ' +
        '    ?event_id crm:P4_has_time-span ?time_id . ' +
        '    ?time_id crm:P82a_begin_of_the_begin ?created .' +
        '   } ' +
        '   OPTIONAL { ?event_id crm:P14_carried_out_by ?creator_id . } ' +
        '   OPTIONAL { ?event_id crm:P7_took_place_at ?place_id . } ' +
        '   OPTIONAL { ' +
        '    ?event_id crm:P11_had_participant ?unit_id . ' +
        '    ?unit_id a wsc:MilitaryUnit . ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    ?event_id crm:P11_had_participant ?participant_id . ' +
        '    ?participant_id a/rdfs:subClassOf* crm:E21_Person . ' +
        '   } ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id dct:source ?source_id . ' +
        '   ?source_id skos:prefLabel ?source . ' +
        '   FILTER(langMatches(lang(?source), "fi")) ' +
        '  } ' +
        '  OPTIONAL { ?id wphs:place_string ?place_string . } ' +
        '  OPTIONAL { ?id wphs:photographer_string ?photographer_string . } ' +
        ' } ';

        var photoByIdResultSet =
        '  VALUES ?id { <ID> } ' +
        '  ?id sch:contentUrl ?url . ';

        var photosByThemeResultSet =
        '  BIND("<VAL>" AS ?theme) ' +
        '  ?id wphs:theme ?theme . ';

        var photosByTimeResultSet =
        ' ?id ^crm:P94_has_created/crm:P4_has_time-span/crm:P82a_begin_of_the_begin ?created . ' +
        ' FILTER(?created >= "<START>"^^xsd:date && ?created <= "<END>"^^xsd:date) ' +
        ' ?id a wsc:Photograph . ';

        var photosByPlaceAndTimeResultSet =
        ' VALUES ?place_id { <PLACE> } ' +
        ' ?id ^crm:P94_has_created [ ' +
        '  crm:P7_took_place_at ?place_id ; ' +
        '  crm:P4_has_time-span/crm:P82a_begin_of_the_begin ?created ' +
        ' ] . ' +
        ' ?id a wsc:Photograph . ' +
        ' FILTER(?created >= "<START>"^^xsd:date && ?created <= "<END>"^^xsd:date) ';

        var photosByUnitResultSet =
        ' VALUES ?unit_id { <ID> } ' +
        ' ?id ^crm:P94_has_created/crm:P11_had_participant ?unit_id . ' +
        ' ?id a wsc:Photograph . ';

        var photosByPersonResultSet =
        ' VALUES ?participant_id { <ID> } ' +
        ' { ?id ^crm:P94_has_created/crm:P11_had_participant ?participant_id . } ' +
        ' UNION ' +
        ' { ?id ^crm:P94_has_created/crm:P14_carried_out_by ?participant_id . } ' +
        ' ?id a wsc:Photograph . ';

        var photosByCemeteryResultSet =
        ' VALUES ?cemetery_id { <ID> } ' +
        ' ?id crm:P138_represents ?cemetery_id . ' +
        ' ?id a wsc:Photograph . ';

        var minimalPhotosWithPlaceByTimeQry = prefixes +
        ' SELECT DISTINCT ?created ?place_id WHERE { ' +
        '   ?id ^crm:P94_has_created [ ' +
        '    crm:P7_took_place_at ?place_id ; ' +
        '    crm:P4_has_time-span/crm:P82a_begin_of_the_begin ?created ' +
        '   ] . ' +
        '   ?id a wsc:Photograph . ' +
        '   FILTER(?created >= "<START>"^^xsd:date && ?created <= "<END>"^^xsd:date) ' +
        ' } ' +
        ' ORDER BY ?created ';

        var minimalPhotosByTimeQry = prefixes +
        ' SELECT DISTINCT ?created' +
        ' WHERE { ' +
        '  ?id ^crm:P94_has_created/crm:P4_has_time-span/crm:P82a_begin_of_the_begin ?created . ' +
        '  FILTER(?created >= "<START>"^^xsd:date && ?created <= "<END>"^^xsd:date) ' +
        '  ?id a wsc:Photograph . ' +
        ' } ' +
        ' ORDER BY ?created ';

        /* API function implementations */

        function getById(id) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = photoByIdResultSet.replace('<ID>', id);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query).then(function(data) {
                if (data.length) {
                    return (data)[0];
                }
                return $q.reject('Does not exist');
            });
        }

        function getByIdList(id, pageSize) {
            if (!id) {
                return $q.when();
            }
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = photoByIdResultSet.replace('<ID>', id);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getByFacetSelections(facetSelections, options) {
            var resultSet = facetSelections.join(' ');
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet, 'DESC(?score) DESC(?color) ?order');
            return endpoint.getObjects(qryObj.query, options.pageSize,
                    qryObj.resultSetQuery);
        }

        function getByTimeSpan(start, end, options) {
            var resultSet = photosByTimeResultSet
                .replace('<START>', start)
                .replace('<END>', end);
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
                .replace('<PLACE>', placeId)
                .replace('<START>', start)
                .replace('<END>' , end);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getByIdUnionPlaceAndTimeSpan(id, placeId, start, end, options) {
            placeId = baseRepository.uriFy(placeId);
            if (!placeId) {
                return $q.when();
            }
            var resultSet = photosByPlaceAndTimeResultSet
                .replace('<PLACE>', placeId)
                .replace('<START>', start)
                .replace('<END>' , end);
            id = baseRepository.uriFy(id);
            if (id) {
                resultSet =
                ' { ' +
                    photoByIdResultSet.replace('<ID>', id) +
                ' } UNION { '
                    + resultSet +
                ' } ';
            }
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getByIdUnionTimeSpan(id, start, end, options) {
            var resultSet = photosByTimeResultSet
                .replace('<START>', start)
                .replace('<END>' , end);
            id = baseRepository.uriFy(id);
            if (id) {
                resultSet =
                ' { ' +
                    photoByIdResultSet.replace('<ID>', id) +
                ' } UNION { '
                    + resultSet +
                ' } ';
            }
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getByPersonId(id, pageSize) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = photosByPersonResultSet.replace('<ID>', id);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getByCemeteryId(id, pageSize) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = photosByCemeteryResultSet.replace('<ID>', id);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            //console.log("photorepo - getByCemeteryId - query:");
            //console.log(qryObj.query);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getByUnitId(id, pageSize) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = photosByUnitResultSet.replace('<ID>', id);
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
            var qry = minimalPhotosWithPlaceByTimeQry
                .replace('<START>', start)
                .replace('<END>' , end);
            return minimalDataService.getObjectsNoGrouping(qry);
        }

        function getMinimalDataByTimeSpan(start, end) {
            // start and end as strings
            var qry = minimalPhotosByTimeQry
                .replace('<START>', start)
                .replace('<END>' , end);
            return minimalDataService.getObjectsNoGrouping(qry);
        }
    }
})();
