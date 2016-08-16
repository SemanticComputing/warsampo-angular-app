(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    function Rank() { }

    Rank.prototype.getDescription = function() {
    		return this.comment ? [this.comment] : [] ;
    };

    function RankMapper() {
        this.objectClass = Rank;
    }

    RankMapper.prototype.postProcess = function(ranks) {
        ranks.forEach(function(rank) {
            if (rank.wikilink) {
                rank.wikilink = [{ id:rank.wikilink, label:rank.label}];
            }
            
		  		if (_.isArray(rank.label)) {
                rank.label = rank.label[0];
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
