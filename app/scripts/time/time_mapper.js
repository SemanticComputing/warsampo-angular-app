(function() {
    'use strict';

    /*
     * Service for transforming time SPARQL results into objects.
     */

    function TimeMapper() { }

    angular.module('eventsApp')
    .factory('timeMapperService', function(objectMapperService, TranslateableObject) {
        var proto = Object.getPrototypeOf(objectMapperService);

        TimeMapper.prototype.reviseObject = reviseObject;
        TimeMapper.prototype.objectClass = TranslateableObject;
        TimeMapper.prototype = angular.extend({}, proto, TimeMapper.prototype);

        return new TimeMapper();

        function reviseObject(obj) {
            if (obj.bob !== obj.eoe) {
                obj.timeString = new Date(obj.bob).toLocaleDateString() + ' - ' +
                    new Date(obj.eoe).toLocaleDateString();
            } else {
                obj.timeString = new Date(obj.bob).toLocaleDateString();
            }

            return obj;
        }

    });
})();
