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
        PhotoMapper.prototype.postProcess = postProcess;
        PhotoMapper.prototype = angular.extend({}, proto, PhotoMapper.prototype);

        return new PhotoMapper();

        function PhotoMapper() {
            this.objectClass = Photo;
        }

        function Photo() { }

        function postProcess(photos) {
            photos.forEach(function(photo) {
                if (!_.isArray(photo.places)) {
                    photo.places = photo.places ? [photo.places] : [];
                }
            });
            return photos;
        }
    }

})();
