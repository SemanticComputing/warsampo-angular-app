(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('unitMapperService', function(_, translateableObjectMapperService, Unit) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        UnitMapper.prototype = angular.extend({}, proto, UnitMapper.prototype);
        UnitMapper.prototype.objectClass = Unit;

        return new UnitMapper();

        function UnitMapper() { }
    })
    .factory('Unit', function(TranslateableObject) {
        Unit.prototype = TranslateableObject.prototype;

        return Unit;

        function Unit() { }
    });
})();
