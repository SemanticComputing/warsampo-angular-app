'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SimileMapCtrl', function ($scope, eventService) {
      var infoHtml = "<div class=''><h3>{0}</h3><p>{1}</p></div>";
      $scope.createTimeMap = function(start, end) {
          (function() {
              return (start && end) ? eventService.getEventsByTimeSpan(start, end) : eventService.getAllEvents();
          })().then(function(data) {
                var res = [];
                data.forEach(function(e) {
                    var entry = {
                        start: e.start_time,
                        title: e.type, //e.description.split(' ')[0],
                        options: {
                            infoHtml: infoHtml.format(eventService.createTitle(e), e.description)
                            //description: e.description
                        }
                    };
                    if (e.start_time !== e.end_time) {
                        entry.end = e.end_time;
                    }

                    if (e.points) {
                        if (e.points.length === 1) {
                            entry.point = e.points[0];
                        }
                        else {
                            entry.placemarks = [{
                                polyline: e.points
                            }];
                            e.points.forEach(function(point) {
                                entry.placemarks.push({ point: point });
                            });
                        }
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
      };


      $scope.showWinterWar = function() {
        $scope.createTimeMap('1939-01-01', '1940-12-31');
      };
      $scope.showContinuationWar = function() {
        $scope.createTimeMap('1941-01-01', '1944-12-31');
      };

      $scope.showWinterWar();

  });
