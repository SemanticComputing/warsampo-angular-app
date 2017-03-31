(function() {
    'use strict';

    /*
     * Service for transforming time SPARQL results into objects.
     */

    function TimeMapper() { }

    angular.module('eventsApp')
    .factory('timeMapperService', function(objectMapperService, TranslateableObject, dateUtilService) {
        var proto = Object.getPrototypeOf(objectMapperService);

        TimeMapper.prototype.reviseObject = reviseObject;
        TimeMapper.prototype.objectClass = TranslateableObject;
        TimeMapper.prototype = angular.extend({}, proto, TimeMapper.prototype);

        return new TimeMapper();

        function reviseObject(obj) {
            obj.timeString = dateUtilService.formatExtremeDateRange(obj.bob, obj.eoe);

            return obj;
        }

    });
})();
