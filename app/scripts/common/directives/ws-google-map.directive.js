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
        self.showOldMaps = true;

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
            // Limit the zoom level
            //google.maps.event.addListener(map, 'zoom_changed', function () {
            //    if (self.map.getZoom() < minZoomLevel) self.map.setZoom(minZoomLevel);
            //});
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
            controlUI.title = 'Click to recenter the map';
            controlDiv.appendChild(controlUI);

            // Set CSS for the control interior.
            var controlText = document.createElement('div');
            controlText.style.color = 'rgb(25,25,25)';
            controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
            controlText.style.fontSize = '16px';
            controlText.style.lineHeight = '38px';
            controlText.style.paddingLeft = '5px';
            controlText.style.paddingRight = '5px';
            controlText.innerHTML = 'Center Map';
            controlUI.appendChild(controlText);

            controlUI.addEventListener('click', function() {
                map.panTo(new google.maps.LatLng(61.578523, 29.318047));
                map.setZoom(9);
                map.minZoom = 9;
                googleMapsService.showOldMaps(map, self.overlays, map.getBounds(), 1);
            });

        }

        function FilterControl(controlDiv, map) {
          	controlDiv.style.padding = '4px';
          	var controlUI = document.createElement('DIV');
          	controlUI.id = "zoomContainer";
          	controlUI.style.cssText="position:absolute;right:7px;width: 70px; height: 21px; z-index: 0; top: 10px;";
          	var controlzoom = document.createElement('DIV');
          	controlzoom.id = "zoom";
          	controlzoom.style.cssText="height: 21px; width: 13px; background-image: url(img/opacity-slider.png); left: 22px; top: 0px; position: absolute; cursor: pointer; background-position: -70px 0px;";
          	var controlzoomSlider = document.createElement('DIV');
          	controlzoomSlider.id = "zoomSlider";
          	controlzoomSlider.style.cssText="height:21px; width:70px; background-image: url(img/opacity-slider.png)";
          	controlzoomSlider.appendChild(controlzoom);
          	controlUI.appendChild(controlzoomSlider);
          	controlDiv.appendChild(controlUI);
          	var zoomSlider = new ExtDraggableObject(controlzoom, { restrictY:true, container:controlzoomSlider});
          	zoomSlider.setValueX(opacity*57);
          	var dragEndEvent = google.maps.event.addListener(zoomSlider, "dragend", function(e) {
          	   var val = zoomSlider.valueX();
          	  	 changeMapTileOpacity(val/57);
          	});

        }
    }
})();
