(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    function Rank() { }

    Rank.prototype.getDescription = function() {
        var arr=[];
        if (this.comment) { arr = arr.concat(this.comment); }
        return arr;
    };

    function RankMapper() {
        this.objectClass = Rank;
    }

    RankMapper.prototype.postProcess = function(ranks) {
        ranks.forEach(function(rank) {
            if (_.isArray(rank.label)) {
                rank.label = rank.label[0];
            }
            if (rank.wikilink) {
                rank.wikilink = [{ id:rank.wikilink, label:rank.label}];
            }
        });

        return ranks;
    };

    angular.module('eventsApp')
    .factory('rankMapperService', function(objectMapperService) {
        var proto = Object.getPrototypeOf(objectMapperService);
        RankMapper.prototype = angular.extend({}, proto, RankMapper.prototype);

        return new RankMapper();
    })
    .factory('Rank', function() {
        return Rank;
    });
})();
