'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('MapCtrl', function ($scope, SparqlService) {
      SparqlService.getDataForTimelineMap()
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
                var ev = {};
                if (e.lat && e.lon) {
                    ev.location = {
                        lat: e.lat.value,
                        lon: e.lon.value
                    };
                } else
                    ev.type = "overview";

                ev.text = {
                    headline: e.description.value.split('.')[0],
                    text: e.description.value
                };
                res.push(ev);
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
