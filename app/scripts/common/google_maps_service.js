'use strict';

angular.module('eventsApp')
.factory('googleMapsService', function(google) {

    var service = {
        createHeatmap: createHeatmap,
        updateHeatmap: updateHeatmap,
        clearHeatmap: clearHeatmap
    };

    return service;

    // Expects a list of objects with lat and lon
    function createHeatmap() {
        var heatmap = new google.maps.visualization.HeatmapLayer({
            radius: 20
        });

        return heatmap;
    }

    function clearHeatmap(heatmap) {
        heatmap.setMap(null);
        return heatmap;
    }

    function updateHeatmap(heatmap, locations, map) {
        var data = [];
        locations.forEach(function(loc) {
            data.push(new google.maps.LatLng(parseFloat(loc.lat), parseFloat(loc.lon)));
        });
        heatmap.setData(data);
        heatmap.setMap(map);
        return heatmap;
    }
});
