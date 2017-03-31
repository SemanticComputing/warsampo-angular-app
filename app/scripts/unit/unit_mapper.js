(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('unitMapperService', function(_, translateableObjectMapperService, Unit) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        UnitMapper.prototype.postProcess = postProcess;
        UnitMapper.prototype = angular.extend({}, proto, UnitMapper.prototype);
        UnitMapper.prototype.objectClass = Unit;

        return new UnitMapper();

        function UnitMapper() { }

        function postProcess(objects) {
            objects.forEach(function(obj) {
                obj.name = obj.name ? _.castArray(obj.name) : [];
                obj.abbrev = obj.abbrev ? _.castArray(obj.abbrev) : [];

                obj.altNames = obj.name.slice();
                obj.altNames.shift();

                obj.abbrev = _.difference(obj.abbrev, obj.name);
            });

            return objects;
        }

    })
    .factory('Unit', function(TranslateableObject) {
        Unit.prototype = TranslateableObject.prototype;

        return Unit;

        function Unit() { }
    });
})();
