(function() {
    'use strict';

    /*
    * Service for transforming photo SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('photoMapperService', photoMapperService)
    .factory('Photo', Photo);

    /* @ngInject */
    function photoMapperService(translateableObjectMapperService, Photo) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);
        PhotoMapper.prototype = angular.extend({}, proto, PhotoMapper.prototype);

        return new PhotoMapper();

        function PhotoMapper() {
            this.objectClass = Photo;
        }
    }

    /* @ngInject */
    function Photo(TranslateableObject) {
        Photo.prototype = angular.extend({}, TranslateableObject.prototype);
        Photo.prototype.getPeriod = getPeriod;

        return Photo;

        function Photo() { }

        function getPeriod() {
            return this.getLangAttr('period');
        }
    }

})();
