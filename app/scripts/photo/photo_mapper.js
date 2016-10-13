(function() {
    'use strict';

    /*
    * Service for transforming photo SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('photoMapperService', photoMapperService);

    /* @ngInject */
    function photoMapperService(_, objectMapperService) {
        var proto = Object.getPrototypeOf(objectMapperService);
        PhotoMapper.prototype = angular.extend({}, proto, PhotoMapper.prototype);

        return new PhotoMapper();

        function PhotoMapper() {
            this.objectClass = Photo;
        }

        function Photo() { }
    }

})();
