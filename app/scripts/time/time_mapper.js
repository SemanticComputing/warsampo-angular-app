(function() {
    'use strict';

    /*
    * Service for transforming time SPARQL results into objects.
    */

    function TimeMapper() { }

    TimeMapper.prototype.makeObject = function(obj) {
        var o = new this.objectClass();

        _.forIn(obj, function(value, key) {
            o[key] = value.value;
        });

        if (o.bob !== o.eoe) {
            o.timeString = new Date(o.bob).toLocaleDateString() + ' - ' +
                new Date(o.eoe).toLocaleDateString();
        } else {
            o.timeString = new Date(o.bob).toLocaleDateString();
        }

        return o;
    };

    angular.module('eventsApp')
    .factory('timeMapperService', function(objectMapperService, TranslateableObject) {
        var proto = Object.getPrototypeOf(objectMapperService);
        TimeMapper.prototype.objectClass = TranslateableObject;
        TimeMapper.prototype = angular.extend({}, proto, TimeMapper.prototype);

        return new TimeMapper();
    });
})();
