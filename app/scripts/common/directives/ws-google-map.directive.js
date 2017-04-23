(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsGoogleMap', function() {
        return {
            restrict:'E',
            scope: {
                persons: '<',
                config: '<'
            },
            controller: GoogleMapContoller,
            controllerAs: 'ctrl',
        };
    });

    /* @ngInject */
    function GoogleMapContoller($scope, $element, google, googleMapsService) {
        var self = this;

        self.map;
        self.markers;

        initMap();

        $scope.$watch('persons', function(val) {
            if (!val || _.isArray(val) && !val.length) {
                return;
            }
            drawMarkers(val)
        });

        function drawMarkers(markers) {
            console.log(markers.getAllSequentially(100));

            var uluru = {lat: -25.363, lng: 131.044};
            var marker = new google.maps.Marker({
                position: uluru,
                map: self.map
            });
        }

        function initMap() {
            var uluru = {lat: -25.363, lng: 131.044};
            self.map = new google.maps.Map($element[0], {
                zoom: 4,
                center: uluru
            });

        }

    }

})();
