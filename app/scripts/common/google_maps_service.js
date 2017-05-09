(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .service('googleMapsService', function(google) {

        var self = this;

        self.plotObjects = plotObjects;
        self.addMapWarperOverlay = addMapWarperOverlay;
        self.createHeatmap = createHeatmap;
        self.clearHeatmap = clearHeatmap;
        self.updateHeatmap = updateHeatmap;
        self.normalizeMapZoom = normalizeMapZoom;

        function plotObjects(objects, map, infoWindow) {
            objects.forEach(function(obj) {
                var infoWindowHtml = '<div id="content">'+
                  '<a href="' + obj.link + '"><h3>' + obj.description + '</h3></a>'+
                  '<div id="bodyContent">'+
                  '<p>Paikka: ' + obj.label + ' (' + obj.type + ')</p>' +
                  '</div>'+
                  '</div>';

                var point = new google.maps.LatLng(obj.lat, obj.lon);
                var marker = new google.maps.Marker({
            		    position: point,
            		    map: map,
                    content : infoWindowHtml
                });
                marker.addListener('click', function() {
                    infoWindow.setContent(marker.content);
                    infoWindow.open(map, marker);
                });

            });
        }

        function addMapWarperOverlay(mapWarperId, overlays, opacity, map) {
          	overlays[mapWarperId] =  createCustomMapType({
                map: map,
                name : 'Map Warper map',
            		//alt			: 'Custom Tile',
            		tileSize : 256,
            		mwId : mapWarperId,
            		BaseUrl : "http://mapwarper.onki.fi/maps/tile/",
            		minZoom : 7,
            		maxZoom : 15
          	});
            map.overlayMapTypes.setAt(mapWarperId, overlays[mapWarperId]);
            overlays[mapWarperId].setOpacity(opacity);
        }

        function createCustomMapType(args) {
            var opts = {
          		  getTileUrl: function(coord, zoom) {
              			var ymax = 1 << zoom;
              			var zFactor=Math.pow(2,zoom);
              			var y = ymax - coord.y -1;
            			  var tileBounds = new google.maps.LatLngBounds(
            				      args.map.getProjection().fromPointToLatLng( new google.maps.Point( (coord.x)*args.tileSize/zFactor, (coord.y+1)*args.tileSize/zFactor ) ),
            				      args.map.getProjection().fromPointToLatLng( new google.maps.Point( (coord.x+1)*args.tileSize/zFactor, (coord.y)*args.tileSize/zFactor ) )
            			   );
            			  return args.BaseUrl + args.mwId + "/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
          		  },
          		  tileSize: new google.maps.Size(args.tileSize, args.tileSize),
          		  isPng: true,
          		  maxZoom:  args.maxZoom,
          		  minZoom:  args.minZoom
          	};
          	var map_type = new google.maps.ImageMapType(opts);
          	map_type.name = args.name;
          	map_type.alt = args.alt;
          	return map_type;
        }

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
