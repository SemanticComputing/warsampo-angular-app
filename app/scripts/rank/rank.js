'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('rankService', function($q, SparqlService, rankRepository,
                personRepository) { 

        var self = this;

        self.fetchRelatedPersons = function(rank) {
            return self.getRelatedPersonsPaged(rank.id, 1).then(function(persons) {
            	if (persons && persons.length) {
                    rank.hasLinks = true;
            		rank.persons = persons;
            	}
                return rank;
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
      
		this.getById = function(id) {
            return rankRepository.getById(id);
        };
        
		this.getRelatedPersons = function(id) {
            return personRepository.getByRankId(id);
        };

		this.getRelatedPersonsPaged = function(id, pageNo) {
            return personRepository.getByRankIdPaged(id, (pageNo - 1) * 10, 10);
        };
        
		this.getRelatedRanks = function(id) {
            return rankRepository.getRelatedRanks(id);
        };

        this.countByRankId = function(id) {
            return personRepository.countByRankId(id);
        };

        self.getRelatedPersonPager = function(id) {
            return {
                totalItems: self.countByRankId(id),
                getPage: function(pageNo) {
                    return self.getRelatedPersonsPaged(id, pageNo);
                }
            };
        };
});

