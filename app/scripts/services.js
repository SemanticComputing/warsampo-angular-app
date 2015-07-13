'use strict';

angular.module('eventsApp')
    .factory('SparqlService', function($http) {

        var URL = 'http://ldf.fi/warsa/sparql';
        var executeQuery = function(sparqlQry) {
            return $http.get(URL + '?query=' + encodeURIComponent(sparqlQry) + '&format=json');
        }

        var timelineMapQry = `
PREFIX hipla: <http://ldf.fi/schema/hipla/> 
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX sch: <http://schema.org/>

SELECT ?id ?start_time ?end_time ?description ?place_label ?lat ?lon ?polygon 
WHERE {
    ?id skos:prefLabel ?description ;
        crm:P4_has_time-span ?time_id ;
        crm:P7_took_place_at ?place_id .
    ?time_id crm:P82a_begin_of_the_begin ?start_time ;
        crm:P82b_end_of_the_end ?end_time .

    OPTIONAL { ?place_id geo:lat ?lat ;
            geo:long ?lon .
    }
    OPTIONAL { ?place_id sch:polygon ?polygon . }
    OPTIONAL { ?place_id skos:prefLabel ?place_label . }
}
ORDER BY ?start_time ?end_time
`;

        var timelineQry = `
PREFIX hipla: <http://ldf.fi/schema/hipla/> 
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?id ?start_time ?end_time ?description ?place_label ?lat ?lon ?type 
WHERE {
    ?id a ?type_id ;
        skos:prefLabel ?description ;
    crm:P4_has_time-span ?time_id .
    ?time_id crm:P82a_begin_of_the_begin ?start_time ;
        crm:P82b_end_of_the_end ?end_time .
    ?type_id skos:prefLabel ?type .
    FILTER(langMatches(lang(?type), "FI"))
}
`;

        var getDataForTimeline = function() {
            return executeQuery(timelineQry);
        };
        var getDataForTimelineMap = function() {
            return executeQuery(timelineMapQry);
        };

        return {
            getDataForTimeline: getDataForTimeline,
            getDataForTimelineMap: getDataForTimelineMap
        };
});

