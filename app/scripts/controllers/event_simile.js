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
      SparqlService.getDataForTimelineMap()
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
                    title: e.description.value.split(' ')[0],
                    options: {
                        description: e.description.value
                    }
                };
                if (e.start_time.value !== e.end_time.value)
                    entry.end = e.end_time.value;

                if (e.lat && e.lon) {
                    entry.point = {
                        lat: e.lat.value,
                        lon: e.lon.value
                    }                        
                } else if (e.polygon) {
                    var l = e.polygon.value.split(" ");
                    l = l.map(function(e) { 
                        var latlon = e.split(',');
                        return { lat: latlon[1], lon: latlon[0] };
                    });
                    entry.polygon = l;
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
                    Timeline.DateTime.DAY, 
                    Timeline.DateTime.MONTH
                ]
            });
        })
        .error(function(data) {
            $scope.error = data;
        });
  });
