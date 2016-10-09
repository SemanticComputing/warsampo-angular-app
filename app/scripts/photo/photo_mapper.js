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
        PhotoMapper.prototype.reviseObject = reviseObject;
        PhotoMapper.prototype = angular.extend({}, proto, PhotoMapper.prototype);

        return new PhotoMapper();

        function PhotoMapper() {
            this.objectClass = Photo;
        }

        function Photo() { }

        function reviseObject(photo) {
            if (!_.isArray(photo.places)) {
                photo.places = [photo.places];
            }
            return photo;
        }
    }

})();
