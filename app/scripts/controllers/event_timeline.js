'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('TimelinejsCtrl', function ($http) {
    var URL = 'http://ldf.fi/warsa/sparql';
    var query = `
PREFIX hipla: <http://ldf.fi/schema/hipla/> 
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?id ?start_time ?end_time ?description ?place_label ?lat ?lon 
WHERE {
?id skos:prefLabel ?description ;
    crm:P4_has_time-span ?time_id .
?time_id crm:P82a_begin_of_the_begin ?start_time ;
    crm:P82b_end_of_the_end ?end_time .
}
`;
    $http.get(URL + '?query=' + encodeURIComponent(query) + '&format=json')
        .success(function(data) {
            console.log(data);
            var res = [];
            data.results.bindings.forEach(function(e) {
                res.push({ 
                    startDate: e.start_time.value.replace(/-/g, ','),
                    endDate: e.end_time.value.replace(/-/g, ','),
                    headline: e.description.value,
                    text: e.description.value
                });
            });
            createStoryJS({
                type: 'timeline',
                width: '800',
                height: '600',
                source: {
                    timeline:
                    {
                        headline: "Itsenäisen Suomen sotien tapahtumat",
                        type: "default",
                        text: "Kuvaus",
                        date: res,
                        era: [
                            {
                                startDate: "1939,11,01",
                                endDate: "1940,03,31",
                                headline: "Talvisota",
                                text: "Talvisodan kuvaus"
                            }
                        ]
                    }
                },
                embed_id: 'timeline'
            });
        })
        .error(function(data) {
            this.error = data;
        });
  });
