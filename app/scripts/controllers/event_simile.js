'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SimileMapCtrl', function ($scope, $http) {
    var URL = 'http://ldf.fi/warsa/sparql';
    var query = `
PREFIX hipla: <http://ldf.fi/schema/hipla/> 
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?id ?start_time ?end_time ?description ?place_label ?lat ?lon 
WHERE {
?id skos:prefLabel ?description ;
    crm:P4_has_time-span ?time_id ;
    crm:P7_took_place_at ?place_id .
?time_id crm:P82a_begin_of_the_begin ?start_time ;
    crm:P82b_end_of_the_end ?end_time .
?place_id geo:lat ?lat ;
    geo:lon ?lon ;
    skos:prefLabel ?place_label .
}
ORDER BY ?start_time ?end_time
`;
    $http.get(URL + '?query=' + encodeURIComponent(query) + '&format=json')
        .success(function(data) {
            console.log(data);
            //data = JSON.parse(data);
            var res = [];
            var ids = []
            data.results.bindings.forEach(function(e) {
                if (ids.indexOf(e.id.value) !== -1)
                    return;
                ids.push(e.id.value);

                var entry = {
                    start: e.start_time.value,
                    point: {
                        lat: e.lat.value,
                        lon: e.lon.value
                    },
                    title: e.description.value.split('.')[0],
                    options: {
                        description: e.description.value
                    }
                };
                if (e.start_time.value !== e.end_time.value)
                    entry.end = e.end_time.value;

                res.push(entry);
            });
            var tm;
            tm = TimeMap.init({
                mapId: "map",               // Id of map div element (required)
                timelineId: "timeline",     // Id of timeline div element (required)
                options: {
                    eventIconPath: "../images/"
                },
                datasets: [
                {
                    id: "artists",
                    title: "Artists",
                    theme: "orange",
                    // note that the lines below are now the preferred syntax
                    type: "basic",
                    options: {
                        items: res
                    }
                }],
                bandIntervals: [
                    Timeline.DateTime.WEEK, 
                    Timeline.DateTime.MONTH
                ]
            });
        })
        .error(function(data) {
            $scope.error = data;
        });
  });
