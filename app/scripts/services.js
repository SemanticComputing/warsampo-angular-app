'use strict';

angular.module('eventsApp')
    .factory('SparqlService', function($http, $q) {

        var URL = 'http://ldf.fi/warsa/sparql';
        var executeQuery = function(sparqlQry) {
            return $http.get(URL + '?query=' + encodeURIComponent(sparqlQry) + '&format=json');
        };

        var eventQry = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX hipla: <http://ldf.fi/schema/hipla/> 
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX sch: <http://schema.org/>

SELECT ?id ?start_time ?end_time ?description ?place_label ?lat ?lon ?polygon ?type
WHERE {
  ?type_id skos:prefLabel ?type .    
  FILTER(langMatches(lang(?type), "FI"))
  ?id a ?type_id ;
        skos:prefLabel ?description ;
        crm:P4_has_time-span ?time_id ;
        crm:P7_took_place_at ?place_id .
    {0}
    ?time_id crm:P82a_begin_of_the_begin ?start_time ;
        crm:P82b_end_of_the_end ?end_time .
    OPTIONAL { 
        ?place_id geo:lat ?lat ;
        geo:long ?lon .
    }
    OPTIONAL { ?place_id sch:polygon ?polygon . }
    OPTIONAL { ?place_id skos:prefLabel ?place_label . }
}
ORDER BY ?start_time ?end_time
`;

        var eventFilterWithinTimeSpan = `
FILTER(?start_time >= "{0}"^^xsd:date && ?end_time <= "{1}"^^xsd:date)
`;

        var eventsWithinTimeSpanQry = eventQry.format(eventFilterWithinTimeSpan);

        function makeObject(event) {
            // Take the event as received and turn it into an object that
            // is easier to handle.
            // Make the location a list as to support multiple locations per event.
            var e = {};

            e.id = event.id.value;
            e.description = event.description.value;
            e.start_time = event.start_time.value;
            e.end_time = event.end_time.value;
            e.place_name = event.place_label.value;

            if (event.polygon) {
                // The event's location is represented as a polygon.
                // Transform the polygon string into a list consisting
                // of a single lat/lon pair object list.
                var l = event.polygon.value.split(" ");
                l = l.map(function(p) { 
                    var latlon = p.split(',');
                    return { lat: latlon[1], lon: latlon[0] };
                });
                e.polygons = [l];
            }
            if (event.lat && event.lon) {
                // The event's location is represented as a point.
                e.points = [{
                    lat: event.lat.value,
                    lon: event.lon.value
                }];
            }

            return e;
        }

        function mergeObjects(first, second) {
            return _.merge(first, second, function(a, b) {
                if (_.isArray(a)) {
                    return a.concat(b);
                }
            });
        }

        function makeObjectList(objects) {
            var event_list = _.transform(objects, function(result, event) {
                event = makeObject(event);
                // Check if this event has been constructed earlier
                var old = _.find(result, function(e) {
                    return e.id === event.id;
                });
                if (old) { 
                    // Merge this triple into the event constructed earlier
                    mergeObjects(old, event);
                }
                else {
                    // This is the first triple related to the event
                    result.push(event);
                }                
            });
            return event_list;
        }

        function getEvents(qry) {
            // Query for events and merge the returned triples into objects.
            return executeQuery(qry).then(function(response) {
                return makeObjectList(response.data.results.bindings);
            }, function(response) {
                return $q.reject(response.data);
            });
        }

        var getEventsByTimeSpan = function(start, end) {
            return getEvents(eventsWithinTimeSpanQry.format(start, end));
        };
        
        var getDataForTimelineMap = function() {
            return executeQuery(eventQry.format(""));
        };

        var getDataForTimeline = function() {
            return executeQuery(eventQry.format(""));
        };

        return {
            getDataForTimeline: getDataForTimeline,
            getDataForTimelineMap: getDataForTimelineMap,
            getEventsByTimeSpan: getEventsByTimeSpan
        };
});

