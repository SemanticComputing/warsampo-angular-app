(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .service('googleMapsService', function(google) {

        var self = this;

        self.createHeatmap = createHeatmap;
        self.clearHeatmap = clearHeatmap;
        self.updateHeatmap = updateHeatmap;
        self.normalizeMapZoom = normalizeMapZoom;

        // Expects a list of objects with lat and lon
        function createHeatmap() {
            var heatmap = new google.maps.visualization.HeatmapLayer({
                radius: 20
            });

            return heatmap;
        }

        function clearHeatmap(heatmap) {
            if (heatmap) {
                heatmap.setMap(null);
            }
            return heatmap;
        }

        function updateHeatmap(heatmap, locations, map) {
            if (!heatmap) {
                return;
            }
            var data = [];
            locations.forEach(function(loc) {
                data.push(new google.maps.LatLng(parseFloat(loc.lat), parseFloat(loc.lon)));
            });
            heatmap.setData(data);
            heatmap.setMap(map);
            return heatmap;
        }

        function normalizeMapZoom(map) {
            //	control not to ever zoom too close up:
            var zminlistener = google.maps.event.addListener(map, 'idle', function() {
                if (map.getZoom() > 8) map.setZoom(8);
                if (map.getZoom() < 2) {
                    map.setZoom(5);
                    map.setCenter({lat: 62.0, lng: 25.0 });
                }
                google.maps.event.removeListener(zminlistener);
            });
            return map;
        }
    });
})();
