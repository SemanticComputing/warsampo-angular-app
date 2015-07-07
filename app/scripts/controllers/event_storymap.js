'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('MapCtrl', function ($scope, $http) {
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
            var res = [
                {
                    type: "overview",
                    text: 
                    {
                        headline: "Talvisota",
                        text: "Talvisota kuvaus"
                    }
                }
            ];
            var ids = []
            data.results.bindings.forEach(function(e) {
                // Purkalla pois duplikaatit
                if (ids.indexOf(e.id.value) !== -1)
                    return;
                ids.push(e.id.value);
                res.push(
                { 
                    location: {
                        lat: e.lat.value,
                        lon: e.lon.value
                    },
                    text: {
                        headline: e.description.value.split('.')[0],
                        text: e.description.value
                    }
                });
            });
            var map_data = {
                width: 800,
                heigth: 600,
                storymap: {
                    language: 'en',
                    map_type: "stamen:toner-lite",
                    map_as_image: false,
                    slides: res
                }
            };
            var storymap = new VCO.StoryMap('mapdiv', map_data);
            window.onresize = function(event) {
                storymap.updateDisplay();
            };
        })
        .error(function(data) {
            $scope.error = data;
        });
  });
