'use strict';

/*
 * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
.service('photoRepository', function($q, _, RESULTSET_SHELL, AdvancedSparqlService, objectMapperService, photoMapperService) {
    var endpoint = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
        photoMapperService);

    var minimalDataService = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
        objectMapperService);

    var prefixes = '' +
    ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
    ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
    ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
    ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
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

    var select =
    ' SELECT ?id ?url ?thumbnail ?thumbnail_url ?description ?created ' +
    '  ?participant_id ?municipality ?place_id ?place_label ?lat ?lon ';

    var photosByPlaceAndTimeResultSet = RESULTSET_SHELL.replace('<CONTENT>',
    ' VALUES ?ref_place_id { {0} } ' +
    '  ?id dc:spatial ?place_id . ' +
    '  ?id dc:created ?created . ' +
    '  FILTER(?created >= "{1}"^^xsd:date && ?created <= "{2}"^^xsd:date) ' +
    '  ?id a photos:Photograph . ' +
    ' OPTIONAL { ' +
    '  ?ref_place_id geosparql:sfWithin ?ref_municipality . ' +
    '  ?ref_municipality a suo:kunta . ' +
    ' } ' +
    ' OPTIONAL { ' +
    '  ?place_id geosparql:sfWithin ?municipality . ' +
    '  ?municipality a suo:kunta . ' +
    ' } ' +
    ' FILTER(?place_id = ?ref_place_id || ?place_id = ?ref_municipality ' +
    '  || ?ref_place_id = ?municipality) ');

    var photosByPlaceAndTimeResultSetQry = prefixes + photosByPlaceAndTimeResultSet;

    var photosByPlaceAndTimeQry = prefixes + select +
    ' { ' +
       photosByPlaceAndTimeResultSet +
    '  ?id dc:spatial ?place_id . ' +
    '  ?id dc:created ?created . ' +
    '  ?id sch:contentUrl ?url ; ' +
    '    sch:thumbnailUrl ?thumbnail_url . ' +
    '  OPTIONAL { ?id skos:prefLabel ?description . } ' +
    '  OPTIONAL { ?place_id skos:prefLabel ?place_label . } ' +
    ' } ';

    var photosByTimeResultSet = RESULTSET_SHELL.replace('<CONTENT>',
    ' GRAPH warsa:photographs { ' +
    '  ?id dc:created ?created . ' +
    ' } ' +
    ' FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ');

    var photosByTimeQry =  prefixes + select +
    ' { ' +
       photosByTimeResultSet +
    '  ?id dc:created ?created . ' +
    '  FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
    '  ?id sch:contentUrl ?url ; ' +
    '     sch:thumbnailUrl ?thumbnail_url . ' +
    '  OPTIONAL { ?id skos:prefLabel ?description . } ' +
    '  OPTIONAL { ?id dc:spatial ?place_id . } ' +
    ' } ';

    var minimalPhotosWithPlaceByTimeQry = prefixes +
    ' SELECT DISTINCT ?created ?place_id ?municipality_id' +
    ' WHERE { ' +
    '     GRAPH warsa:photographs { ' +
    '       ?id dc:spatial ?place_id . ' +
    '       ?id dc:created ?created . ' +
    '       FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
    '     } ' +
    '     OPTIONAL { ?place_id geosparql:sfWithin ?municipality_id . ?municipality_id a suo:kunta . } ' +
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

    var photosByPersonResultSet = RESULTSET_SHELL.replace('<CONTENT>',
    ' 	VALUES ?person { {0} } . ' +
    ' 	?id dcterms:subject ?person .  ');

    var photosByPersonQry = prefixes + select +
    ' { ' +
       photosByPersonResultSet +
    '  ?id dcterms:created ?created . ' +
    '  ?id sch:contentUrl ?url . ' +
    '  ?id sch:thumbnailUrl ?thumbnail_url . ' +
    '  ?id dcterms:description ?description . ' +
    '  ?id a photos:Photograph . ' +
    ' }';

    this.getByTimeSpan = function(start, end, pageSize) {
        var qry = photosByTimeQry.format(start, end);
        return endpoint.getObjects(qry, pageSize);
    };

    this.getByPlaceAndTimeSpan = function(place_id, start, end, pageSize) {
        if (_.isArray(place_id)) {
            place_id = '<{0}>'.format(place_id.join('> <'));
        } else if (place_id) {
            place_id = '<{0}>'.format(place_id);
        } else {
            return $q.when();
        }
        var qry = photosByPlaceAndTimeQry.format(place_id, start, end);
        return endpoint.getObjects(qry, pageSize);
    };

    this.getByPersonId = function(id, pageSize) {
        if (_.isArray(id)) {
            id = '<{0}>'.format(id.join('> <'));
        } else if (id) {
            id = '<{0}>'.format(id);
        } else {
            return $q.when();
        }
        var qry = photosByPersonQry.format(id);
        return endpoint.getObjects(qry, pageSize);
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

