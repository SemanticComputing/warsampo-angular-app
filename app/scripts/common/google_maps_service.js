(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    /* @ngInject */
    .service('googleMapsService', function(google, baseService, $http) {

        var self = this;

        self.plotObjects = plotObjects;
        self.addMapWarperOverlay = addMapWarperOverlay;
        self.createHeatmap = createHeatmap;
        self.clearHeatmap = clearHeatmap;
        self.updateHeatmap = updateHeatmap;
        self.normalizeMapZoom = normalizeMapZoom;
        self.removeMarkersFromMap = removeMarkersFromMap;
        self.showOldMaps = showOldMaps;

        function plotObjects(objects, map, infoWindow) {
            var markers = [];
            objects.forEach(function(obj) {
                var infoWindowHtml = '';
                var objId = baseService.getIdFromUri(obj.id);
                if (obj.id.startsWith('http://ldf.fi/warsa/actors/')) {
                    infoWindowHtml = '<div id="content">'+
                      '<a href="/persons/page/' + objId + '"><h3>' + obj.description + '</h3></a>'+
                      '<div id="bodyContent">'+
                      '<p>Paikka: ' + obj.label + ' (' + obj.type + ')</p>' +
                      '</div>'+
                      '</div>';
                } else if (obj.id.startsWith('http://ldf.fi/warsa/places/cemeteries/')) {
                    var fMun = '';
                    if (obj.hasOwnProperty('former_municipality')) {
                        fMun = '<p>Entinen kunta: ' + obj.former_municipality + '</p>';
                    }
                    infoWindowHtml = '<div id="content">'+
                      '<a href="/cemeteries/page/' + objId + '"><h3>' + obj.label + '</h3></a>'+
                      '<div id="bodyContent">'+
                      '<p>Kunta: ' + obj.current_municipality + '</p>' +
                      fMun +
                      '</div>'+
                      '</div>';
                }

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
                markers.push(marker);

            });
            return markers;
        }

        function showOldMaps(map, overlays, bbox, page) {
            // Map Warper bounding box syntax is
            // lon_min, lat_min, lon_max, lat_max
            var b = bbox.toUrlValue().split(",");
            var bbox_to_mw = b[1].concat(",", b[0], ",", b[3], ",", b[2]);
            var mwUrl = 'http://ldf.fi/corsproxy/mapwarper.onki.fi/maps/geosearch';
            var httpConf = {
                params: {
                    bbox : bbox_to_mw,
                    format : "json",
                    operation : "intersect",
                    page: page
                }
            }
            $http.get(mwUrl, httpConf).then(function(response) {
                response.data.items.forEach(function(item) {
                    console.log(item);
                    addMapWarperOverlay(map, overlays, item.id, item.title, 0.75);
                });

            }, function(response) {
                console.log(response);
            });

        }

        function addMapWarperOverlay(map, overlays, mapWarperId, title, opacity) {
          	overlays[mapWarperId] =  createCustomMapType({
                map: map,
                name : title,
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

        function changeMapTileOpacity(overlays, opacity){
        	for(var id in overlays){
        		if (overlays[id] != null) {
        			   overlays[id].setOpacity(_opacity);
        		}
        	}
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

        function removeMarkersFromMap(markers) {
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
        		}
        }

    });
})();
