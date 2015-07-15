'use strict';

angular.module('eventsApp')
    .factory('SparqlService', function($http, $q) {

        var URL = 'http://ldf.fi/warsa/sparql';
        var executeQuery = function(sparqlQry) {
            return $http.get(URL + '?query=' + encodeURIComponent(sparqlQry) + '&format=json');
        };

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

        function simplify(event) {
            var e = {};

            e.id = event.id.value;
            e.description = event.description.value;
            e.start_time = event.start_time.value;
            e.end_time = event.end_time.value;
            e.place_name = event.place_label.value;

            if (event.polygon) {
                var l = event.polygon.value.split(" ");
                l = l.map(function(p) { 
                    var latlon = p.split(',');
                    return { lat: latlon[1], lon: latlon[0] };
                });
                e.polygons = [l];
            }
            if (event.lat && event.lon) {
                e.points = [{
                    lat: event.lat.value,
                    lon: event.lon.value
                }];
            }

            return e;
        }

        var getEventsForTimelineMap = function() {
            return executeQuery(timelineMapQry).then(function(response) {
                var event_list = _.transform(response.data.results.bindings, function(result, event) {
                    event = simplify(event);
                    var old = _.find(result, function(e) {
                        return e.id === event.id;
                    });
                    if (old) { 
                        _.merge(old, event);
                    }
                    else {
                        result.push(event);
                    }                
                });
                return event_list;
            }, function(response) {
                return $q.reject(response.data);
            });
        };

        return {
            getEventsForTimelineMap: getEventsForTimelineMap,
            getDataForTimeline: getDataForTimeline,
            getDataForTimelineMap: getDataForTimelineMap
        };
});

