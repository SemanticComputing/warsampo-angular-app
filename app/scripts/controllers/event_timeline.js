'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('TimelinejsCtrl', function ($scope, $http, SparqlService) {
      SparqlService.getDataForTimeline()
        .success(function(data) {
            console.log(data);
            var res = [];
            data.results.bindings.forEach(function(e) {
                res.push({ 
                    startDate: e.start_time.value.replace(/-/g, ','),
                    endDate: e.end_time.value.replace(/-/g, ','),
                    headline: e.description.value.split('.')[0],
                    text: e.description.value,
                    tag: e.type.value
                });
            });
            createStoryJS({
                type: 'timeline',
                width: '800',
                height: '600',
                lang: 'fi',
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
            $scope.error = data;
        });
  });
