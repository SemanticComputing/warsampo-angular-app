(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    function Medal() { }

    Medal.prototype.getDescription = function() {
        var arr=[];
        if (this.comment) { arr = arr.concat(this.comment); }
        return arr;
    };

    function MedalMapper() {
        this.objectClass = Medal;
    }

    MedalMapper.prototype.postProcess = function(medals) {
        medals.forEach(function(medal) {
            if (_.isArray(medal.label)) {
                medal.label = medal.label[0];
            }
        });

        return medals;
    };

    angular.module('eventsApp')
    .factory('medalMapperService', function(objectMapperService) {
        var proto = Object.getPrototypeOf(objectMapperService);
        MedalMapper.prototype = angular.extend({}, proto, MedalMapper.prototype);

        return new MedalMapper();
    })
    .factory('Medal', function() {
        return Medal;
    });
})();
