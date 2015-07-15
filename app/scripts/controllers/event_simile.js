'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SimileMapCtrl', function ($scope, SparqlService) {
      SparqlService.getEventsForTimelineMap()
        .then(function(data) {
            var res = [];
            data.forEach(function(e) {
                var entry = {
                    start: e.start_time,
                    title: e.description.split(' ')[0],
                    options: {
                        description: e.description
                    }
                };
                if (e.start_time !== e.end_time) {
                    entry.end = e.end_time;
                }

                if (e.points) {
                    entry.point = e.points[0];
                } else if (e.polygons) {
                    entry.polygon = e.polygons[0];
                } else {
                    entry.options.noPlacemarkLoad = true;
                }

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
                    id: "warsa",
                    title: "Itsenäisen Suomen sotien tapahtumat",
                    theme: "orange",
                    type: "basic",
                    options: {
                        items: res
                    }
                }],
                bandIntervals: [
                    Timeline.DateTime.DAY, 
                    Timeline.DateTime.MONTH
                ]
            });
        }, function(data) {
            $scope.error = data;
        });
  });
