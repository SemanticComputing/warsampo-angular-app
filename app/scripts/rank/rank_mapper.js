(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    function Rank() { }

    function RankMapper() { }

    RankMapper.prototype.postProcess = function(ranks) {
        ranks.forEach(function(rank) {
            if (rank.wikilink) {
                rank.wikilink = [{ id: rank.wikilink, label: rank.getLabel()}];
            }
        });

        return ranks;
    };

    angular.module('eventsApp')
        .factory('rankMapperService', function(translateableObjectMapperService, Rank) {
            var proto = Object.getPrototypeOf(translateableObjectMapperService);
            RankMapper.prototype = angular.extend({}, proto, RankMapper.prototype);
            RankMapper.objectClass = Rank;

            return new RankMapper();
        })
        .factory('Rank', function(TranslateableObject) {
            Rank.prototype = TranslateableObject.prototype;
            return Rank;
        });
})();
