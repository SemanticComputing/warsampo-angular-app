(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('medalMapperService', function(translateableObjectMapperService, Medal) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);
        MedalMapper.prototype = angular.extend({}, proto, MedalMapper.prototype);
        MedalMapper.objectClass = Medal;

        return new MedalMapper();

        function MedalMapper() { }

    })
    .factory('Medal', function(TranslateableObject) {
        Medal.prototype = TranslateableObject.prototype;
        return Medal;

        function Medal() { }
    });

})();
