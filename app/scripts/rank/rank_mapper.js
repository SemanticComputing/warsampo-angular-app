(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('rankMapperService', function(translateableObjectMapperService, Rank) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        RankMapper.prototype.postProcess = postProcess;
        RankMapper.prototype = angular.extend({}, proto, RankMapper.prototype);
        RankMapper.objectClass = Rank;

        return new RankMapper();

        function RankMapper() { }

        function postProcess(ranks) {
            ranks = translateableObjectMapperService.postProcess(ranks);

            ranks.forEach(function(rank) {
                if (rank.wikilink) {
                    rank.wikilink = [{
                        id: rank.wikilink,
                        label: rank.getLabel(),
                        getLabel: function() { rank.getLabel(); }
                    }];
                }
            });

            return ranks;
        }
    })
    .factory('Rank', function(TranslateableObject) {
        Rank.prototype = TranslateableObject.prototype;

        return Rank;

        function Rank() { }

    });
})();
