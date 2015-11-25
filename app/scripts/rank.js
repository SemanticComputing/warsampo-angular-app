'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('rankService', function($q, SparqlService, rankRepository,
                personRepository) { 

        var self = this;

        self.fetchRelatedPersons = function(rank) {
            return self.getRelatedPersons(rank.id).then(function(persons) {
            	if (persons.length) {
            		self.persons = persons;
            	}
            });
        };
        
        self.fetchRelatedRanks = function(rank) {
            return self.getRelatedRanks(rank.id).then(function(relatedRanks) {
                rank.lowerRanks = rank.relatedRanks = rank.upperRanks = [];
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
            });
        };

        //	for info page:
        self.fetchRelated = function(rank) {
            var related = [
                self.fetchRelatedRanks(rank),
                self.fetchRelatedPersons(rank)
            ];
            return self.fetchRelatedRanks().then(
               function() { return self.fetchRelatedPersons()}).then(function() {
               if (self.persons || self.relatedRanks ) {  self.hasLinks = true; }
            });
        };
      
		this.getById = function(id) {
            return rankRepository.getById(id);
        };
        
		this.getRelatedPersons = function(id) {
            return personRepository.getByRankId(id);
        };
        
		this.getRelatedRanks = function(id) {
            return rankRepository.getRelatedRanks(id);
        };
});

