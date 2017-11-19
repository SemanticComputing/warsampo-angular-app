(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsGoogleMap', function() {
        return {
            restrict:'E',
            scope: {
                places: '<',
            },
            controller: GoogleMapContoller,
            controllerAs: 'ctrl',
        };
    });

    /* @ngInject */
    function GoogleMapContoller($scope, $element, google, googleMapsService) {
        var self = this;

        self.map;
        self.markers = [];
        self.infoWindow;
        self.overlays = {}; // google.maps.ImageMapType objects, used for historical maps
        self.showOldMaps = false;
        self.opacity = 0.75; // initial opacity for historical maps
        self.minZoomLevel = 0;

        initMap();
        addOldMapFunctionality();

        $scope.$watch('places', function(val) {
            if (!val || _.isArray(val) && !val.length) {
                return;
            }
            googleMapsService.removeMarkersFromMap(self.markers);
            self.markers = googleMapsService.plotObjects(val, self.map, self.infoWindow);
        });

        function initMap() {
            var mapOptions = {
                mapTypeId: google.maps.MapTypeId.ROAD,
                center: new google.maps.LatLng(65.44000165965534, 27.04906940460205),
                zoom: 4,
            };
            self.map = new google.maps.Map($element[0], mapOptions);
            self.infoWindow = new google.maps.InfoWindow({content: "empty" });
        }

        function addOldMapFunctionality(){
            var oldMapControlDiv = document.createElement('div');
            var oldMapControl = new OldMapControl(oldMapControlDiv, self.map);
            oldMapControlDiv.index = 1;
            self.map.controls[google.maps.ControlPosition.TOP_CENTER].push(oldMapControlDiv);

            // add old map opacity controller
            var filterDiv = document.createElement('div');
            var mControl = new FilterControl(filterDiv, self.map);
            filterDiv.index = 1;
            filterDiv.style.cssText="position:absolute;right:7px;";
            self.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(filterDiv);

            // Limit the zoom level
            google.maps.event.addListener(self.map, 'zoom_changed', function () {
               if (self.map.getZoom() < self.minZoomLevel) self.map.setZoom(self.minZoomLevel);
            });
        }

        function OldMapControl(controlDiv, map) {

            // Set CSS for the control border.
            var controlUI = document.createElement('div');
            controlUI.style.backgroundColor = '#fff';
            controlUI.style.border = '2px solid #fff';
            controlUI.style.borderRadius = '3px';
            controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
            controlUI.style.cursor = 'pointer';
            controlUI.style.marginBottom = '22px';
            controlUI.style.textAlign = 'center';
            controlUI.title = 'Maanmittaushallitus ja Topografikunta valmistivat neliväristä topografista karttaa 1:100 000 vuosina 1928-51.';
            controlDiv.appendChild(controlUI);

            // Set CSS for the control interior.
            var controlText = document.createElement('div');
            controlText.style.color = 'rgb(25,25,25)';
            controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
            controlText.style.fontSize = '16px';
            controlText.style.lineHeight = '38px';
            controlText.style.paddingLeft = '5px';
            controlText.style.paddingRight = '5px';
            controlText.innerHTML = 'Näytä Karjalan kartat';
            controlText.id = 'old-map-control-text';
            controlUI.appendChild(controlText);

            controlUI.addEventListener('click', function() {
                if (self.showOldMaps) {
                     map.panTo(new google.maps.LatLng(65.44000165965534, 27.04906940460205));
                     map.setZoom(4);
                     document.getElementById('zoomContainer').style.visibility = 'hidden';
                     self.showOldMaps = false;
                     self.minZoomLevel = 0;
                } else {
                    map.panTo(new google.maps.LatLng(61.578523, 29.318047));
                    map.setZoom(9);
                    self.minZoomLevel = 9;
                    document.getElementById('zoomContainer').style.visibility = 'visible';
                    document.getElementById('old-map-control-text').innerHTML = 'Piilota Karjalan kartat';
                    googleMapsService.showOldMaps(map, self.overlays, map.getBounds(), '1928', 1);
                    self.showOldMaps = true;
                }

            });
        }

        function FilterControl(controlDiv, map) {
          	controlDiv.style.padding = '4px';
          	var controlUI = document.createElement('DIV');
          	controlUI.id = "zoomContainer";
          	controlUI.style.cssText="position:absolute;right:7px;width: 70px; height: 21px; z-index: 0; top: 10px;";
            controlUI.style.visibility = 'hidden';
          	var controlzoom = document.createElement('DIV');
          	controlzoom.id = "zoom";
          	controlzoom.style.cssText="height: 21px; width: 13px; background-image: url(images/opacity-slider.png); left: 22px; top: 0px; position: absolute; cursor: pointer; background-position: -70px 0px;";
          	var controlzoomSlider = document.createElement('DIV');
          	controlzoomSlider.id = "zoomSlider";
          	controlzoomSlider.style.cssText="height:21px; width:70px; background-image: url(images/opacity-slider.png)";
          	controlzoomSlider.appendChild(controlzoom);
          	controlUI.appendChild(controlzoomSlider);
          	controlDiv.appendChild(controlUI);
          	var zoomSlider = new ExtDraggableObject(controlzoom, { restrictY:true, container:controlzoomSlider});
          	zoomSlider.setValueX(self.opacity*57);
          	var dragEndEvent = google.maps.event.addListener(zoomSlider, "dragend", function(e) {
          	     var val = zoomSlider.valueX();
          	  	    googleMapsService.changeMapTileOpacity(self.overlays, val/57);
          	});
        }

    }
})();
