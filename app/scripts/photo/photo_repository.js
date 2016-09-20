(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('photoRepository', photoRepository);

    /* @ngInject */
    function photoRepository($q, _, AdvancedSparqlService, PLACE_PARTIAL_QUERY,
                objectMapperService, photoMapperService, QueryBuilderService) {

        var self = this;

        var endpoint = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
            photoMapperService);

        var minimalDataService = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
            objectMapperService);

        var prefixes =
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX warsaplaces: <http://ldf.fi/warsa/places/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX dctype: <http://purl.org/dc/dcmitype/> ' +
        ' PREFIX dc: <http://purl.org/dc/terms/> ' +
        ' PREFIX text: <http://jena.apache.org/text#> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var select =
        ' SELECT DISTINCT ?id ?url ?thumbnail ?thumbnail_url ?description ?created ' +
        '  ?participant_id ?unit_id ?municipality ?place_id ?place_label ?lat ?lon ?place_string ' +
        '  ?source ?creator ?photographer_string ';

        var photosByPlaceAndTimeResultSet =
        ' VALUES ?ref_place_id { {0} } ' +
        ' ?id dc:created ?created . ' +
        ' FILTER(?created >= "{1}"^^xsd:date && ?created <= "{2}"^^xsd:date) ' +
        ' ?id a photos:Photograph . ' +
        ' { ?id dc:spatial ?place_id  . ' +
        '   { ' +
        '     ?place_id geosparql:sfWithin ?municipality . ' +
        '     ?municipality a suo:kunta . ' +
        '     ?ref_place_id geosparql:sfWithin ?municipality . ' +
        '   } UNION ' +
        '   { ' +
        '     ?place_id a suo:kunta . ' +
        '     ?ref_place_id geosparql:sfWithin ?place_id ' +
        '   } UNION ' +
        '   { ' +
        '     ?ref_place_id a suo:kunta . ' +
        '     ?place_id geosparql:sfWithin ?ref_place_id ' +
        '   } ' +
        ' } UNION { ?id dc:spatial ?ref_place_id } ' +
        ' UNION { ' +
        '   { ?id dc:spatial ?place_id . ' +
        '     FILTER NOT EXISTS { ' +
        '       ?place_id a [] . ' +
        '       ?ref_place_id a [] . ' +
        '     } ' +
        '   } ' +
        '   SERVICE <http://ldf.fi/pnr/sparql> { ' +
        '     { ' +
        '       ?place_id crm:P89_falls_within  ?municipality . ' +
        '       { ?municipality a <http://ldf.fi/pnr-schema#place_type_540> } UNION { ?municipality a <http://ldf.fi/pnr-schema#place_type_550> } ' +
        '       ?ref_place_id crm:P89_falls_within  ?municipality . ' +
        '     } UNION { ' +
        '       { ?place_id a <http://ldf.fi/pnr-schema#place_type_540> } UNION { ?place_id a <http://ldf.fi/pnr-schema#place_type_550> } ' +
        '       ?ref_place_id crm:P89_falls_within ?place_id ' +
        '     } UNION { ' +
        '       { ?ref_place_id a <http://ldf.fi/pnr-schema#place_type_540> } UNION { ?ref_place_id a <http://ldf.fi/pnr-schema#place_type_550> } ' +
        '       ?place_id crm:P89_falls_within ?ref_place_id ' +
        '     } ' +
        '   } ' +
        ' } ';

        var placePartial =
        ' OPTIONAL { ' +
        '   ?id dc:spatial ?place_id . ' +
            PLACE_PARTIAL_QUERY +
        ' } ';

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
        '  OPTIONAL { ?id dc:creator ?creator . } ' +
        '  OPTIONAL { ?id photos:place_string ?place_string . } ' +
        '  OPTIONAL { ?id photos:photographer_string ?photographer_string . } ' +
        '  <PLACE> ' +
        ' } ';

        var photoQryExtended = photoQry.replace('<PLACE>', placePartial);
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
        ' SELECT DISTINCT ?created ?place_id ?municipality_id WHERE { ' +
        '  { ' +
        '   SELECT DISTINCT ?place_id ?created { ' +
        '    GRAPH warsa:photographs { ' +
        '     ?id dc:spatial ?place_id . ' +
        '     ?id dc:created ?created . ' +
        '     FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        '    } ' +
        '   } ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?place_id geosparql:sfWithin ?municipality_id . ' +
        '   ?municipality_id a suo:kunta . ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   SERVICE <http://ldf.fi/pnr/sparql> { ' +
        '    ?place_id crm:P89_falls_within  ?municipality_id . ' +
        '    { ?municipality_id a <http://ldf.fi/pnr-schema#place_type_540> } ' +
        '    UNION ' +
        '    { ?municipality_id a <http://ldf.fi/pnr-schema#place_type_550> } ' +
        '   } ' +
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

        /* Public API */

        self.getById = getById;
        self.getByTimeSpan = getByTimeSpan;
        self.getByPlaceAndTimeSpan = getByPlaceAndTimeSpan;
        self.getByPersonId = getByPersonId;
        self.getByUnitId = getByUnitId;
        self.getMinimalDataWithPlaceByTimeSpan = getMinimalDataWithPlaceByTimeSpan;
        self.getMinimalDataByTimeSpan = getMinimalDataByTimeSpan;
        self.getByFacetSelections = getByFacetSelections;

        /* API function implementations */

        function getById(id) {
            var resultSet = singlePhotoQryResultSet.format(id);
            var qryObj = queryBuilder.buildQuery(photoQryExtended, resultSet);
            return endpoint.getObjects(qryObj.query).then(function(data) {
                if (data.length) {
                    return (data)[0];
                }
                return $q.reject('Does not exist');
            });
        }

        function getByFacetSelections(facetSelections, options) {
            var resultSet = facetQryResultSet.format(facetSelections);
            var qryObj = queryBuilder.buildQuery(photoQryExtended, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize,
                    qryObj.resultSetQuery);
        }

        function getByTimeSpan(start, end, options) {
            var resultSet = photosByTimeResultSet.format(start, end);
            var query =  options.extended ? photoQryExtended : photoQry;
            var qryObj = queryBuilder.buildQuery(query, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize,
                    qryObj.resultSetQuery);
        }

        function getByPlaceAndTimeSpan(place_id, start, end, options) {
            if (_.isArray(place_id)) {
                place_id = '<{0}>'.format(place_id.join('> <'));
            } else if (place_id) {
                place_id = '<{0}>'.format(place_id);
            } else {
                return $q.when();
            }
            var resultSet = photosByPlaceAndTimeResultSet.format(place_id, start, end);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getByPersonId(id, pageSize) {
            if (_.isArray(id)) {
                id = '<{0}>'.format(id.join('> <'));
            } else if (id) {
                id = '<{0}>'.format(id);
            } else {
                return $q.when();
            }
            var resultSet = photosByPersonResultSet.format(id);
            var qryObj = queryBuilder.buildQuery(photoQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getByUnitId(id, pageSize) {
            if (_.isArray(id)) {
                id = '<{0}>'.format(id.join('> <'));
            } else if (id) {
                id = '<{0}>'.format(id);
            } else {
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
