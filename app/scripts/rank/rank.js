(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('rankService', function($q, rankRepository, personRepository, Settings) {

        var self = this;

        self.fetchRelatedPersons = function(rank) {
            return self.getRelatedPersonPager(rank.id).then(function(pager) {
                rank.persons = pager;
                return rank.persons.getTotalCount().then(function(count) {
                    if (count) {
                        rank.hasLinks = true;
                    }
                    return rank;
                });
            });
        };

        self.fetchRelatedRanks = function(rank) {
            return self.getRelatedRanks(rank.id).then(function(relatedRanks) {
                rank.lowerRanks = [];
                rank.relatedRanks = [];
                rank.upperRanks = [];
                if (relatedRanks && relatedRanks.length) {
                    rank.hasLinks = true;
                    relatedRanks.forEach(function(relatedRank) {
                        var level = relatedRank.level ? parseInt(relatedRank.level) : 1;
                        switch (level) {
                            case 0: {
                                rank.lowerRanks.push(relatedRank);
                                break;
                            } case 1: {
                                rank.relatedRanks.push(relatedRank);
                                break;
                            } case 2: {
                                rank.upperRanks.push(relatedRank);
                                break;
                            }
                        }
                    });
                }
                return rank;
            });
        };

        //	for info page:
        self.fetchRelated = function(rank) {
            var related = [
                self.fetchRelatedRanks(rank),
                self.fetchRelatedPersons(rank)
            ];
            return $q.all(related).then(function() {
                return rank;
            });
        };

        self.getById = function(id) {
            return rankRepository.getById(id).then(function(rank) {
                if (rank.length) {
                    return rank[0];
                }
                return $q.reject('Does not exist');
            });
        };

        self.getRelatedPersons = function(id) {
            return personRepository.getByRankId(id);
        };

        self.getRelatedRanks = function(id) {
            return rankRepository.getRelatedRanks(id);
        };

        self.countByRankId = function(id) {
            return personRepository.countByRankId(id);
        };

        self.getRelatedPersonPager = function(id) {
            return personRepository.getByRankId(id, Settings.pageSize);
        };
    });
})();
