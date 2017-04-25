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
        self.markers;

        initMap();

        $scope.$watch('places', function(val) {
            if (!val || _.isArray(val) && !val.length) {
                return;
            }
            googleMapsService.plotObjects(val, self.map);
        });

        function initMap() {
            var mapOptions = {
                mapTypeId: google.maps.MapTypeId.ROAD,
                center: new google.maps.LatLng(65.44000165965534, 27.04906940460205),
                zoom: 4,
            };
            self.map = new google.maps.Map($element[0], mapOptions);
        }
    }

})();
