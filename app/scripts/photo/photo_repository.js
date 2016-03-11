(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('photoRepository', function($q, _, AdvancedSparqlService, PLACE_PARTIAL_QUERY,
                objectMapperService, photoMapperService, QueryBuilderService) {

        var endpoint = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
            photoMapperService);

        var minimalDataService = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
            objectMapperService);

        var prefixes = '' +
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
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var select =
        ' SELECT DISTINCT ?id ?url ?thumbnail ?thumbnail_url ?description ?created ' +
        '  ?participant_id ?municipality ?place_id ?place_label ?lat ?lon ';

        var photosByPlaceAndTimeResultSet =
        ' VALUES ?ref_place_id { {0} } ' +
        ' ?id dc:spatial ?place_id . ' +
        ' ?id dc:created ?created . ' +
        ' FILTER(?created >= "{1}"^^xsd:date && ?created <= "{2}"^^xsd:date) ' +
        ' OPTIONAL { ' +
        '  ?ref_place_id geosparql:sfWithin ?ref_municipality . ' +
        '  ?ref_municipality a suo:kunta . ' +
        ' } ' +
        ' OPTIONAL { ' +
        '  ?place_id geosparql:sfWithin ?municipality . ' +
        '  ?municipality a suo:kunta . ' +
        ' } ' +
        ' FILTER(?place_id = ?ref_place_id || ?place_id = ?ref_municipality ' +
        '  || ?ref_place_id = ?municipality) ' +
        '  ?id a photos:Photograph . ';

        var placePartial =
        ' OPTIONAL { ?id dc:spatial ?place_id . ' +
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
        '  <PLACE> ' +
        ' } ';

        var photoQryExtended = photoQry.replace('<PLACE>', placePartial);
        photoQry = photoQry.replace('<PLACE>', '');

        var photosByTimeResultSet =
        ' GRAPH warsa:photographs { ' +
        '  ?id dc:created ?created . ' +
        ' } ' +
        ' FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ';

        var photosByPersonResultSet =
        ' VALUES ?participant_id { {0} } ' +
        ' ?id dc:subject ?participant_id .  ' +
        ' ?id a photos:Photograph . ';

        var minimalPhotosWithPlaceByTimeQry = prefixes +
        ' SELECT DISTINCT ?created ?place_id ?municipality_id WHERE { ' +
        '  GRAPH warsa:photographs { ' +
        '   ?id dc:spatial ?place_id . ' +
        '   ?id dc:created ?created . ' +
        '   FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?place_id geosparql:sfWithin ?municipality_id . ' +
        '   ?municipality_id a suo:kunta . ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   SERVICE <http://ldf.fi/pnr/sparql> { ' +
        '    OPTIONAL { ' +
        '     ?place_id crm:P89_falls_within  ?municipality_id . ' +
        '     ?municipality_id a ?mt . ' +
        '     FILTER(?mt = <http://ldf.fi/pnr-schema#place_type_540> || ' +
        '      ?mt = <http://ldf.fi/pnr-schema#place_type_550>) ' +
        '    } ' +
        '   } ' +
        '  } ' +
        ' } ' +
        ' ORDER BY ?created ';

        var minimalPhotosByTimeQry = prefixes +
        ' SELECT DISTINCT ?created' +
        ' WHERE { ' +
        '     GRAPH warsa:photographs { ' +
        '       ?id dc:created ?created . ' +
        '       FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        '     } ' +
        ' } ' +
        ' ORDER BY ?created ';

        this.getByTimeSpan = function(start, end, options) {
            var resultSet = photosByTimeResultSet.format(start, end);
            var query =  options.extended ? photoQryExtended : photoQry;
            var qryObj = queryBuilder.buildQuery(query, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        };

        this.getByPlaceAndTimeSpan = function(place_id, start, end, options) {
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
        };

        this.getByPersonId = function(id, pageSize) {
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
        };

        this.getMinimalDataWithPlaceByTimeSpan = function(start, end) {
            // start and end as strings
            var qry = minimalPhotosWithPlaceByTimeQry.format(start, end);
            return minimalDataService.getObjectsNoGrouping(qry);
        };

        this.getMinimalDataByTimeSpan = function(start, end) {
            // start and end as strings
            var qry = minimalPhotosByTimeQry.format(start, end);
            return minimalDataService.getObjectsNoGrouping(qry);
        };
    });
})();
