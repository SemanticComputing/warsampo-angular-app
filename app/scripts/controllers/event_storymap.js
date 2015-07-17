'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('MapCtrl', function ($scope, Event) {
      Event.getEventsByTimeSpan('1939-01-01', '1940-12-31')
        .then(function(data) {
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
            data.forEach(function(e) {
                var ev = {};
                if (e.points) {
                    ev.location = e.points[0];
                } else {
                    ev.type = "overview";
                }

                ev.text = {
                    headline: e.description.split('.')[0],
                    text: e.description
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
            /* global VCO */
            var storymap = new VCO.StoryMap('mapdiv', map_data);
            window.onresize = function() {
                storymap.updateDisplay();
            };
        }, function(data) {
            $scope.error = data;
        });
  });
