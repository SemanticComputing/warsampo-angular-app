'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('medalService', function($q, SparqlService, medalRepository,
                personRepository, Settings) {

        var self = this;

        self.fetchRelatedPersons = function(medal) {
            return self.getRelatedPersonPager(medal.id).then(function(pager) {
                medal.persons = pager;
                return medal.persons.getTotalCount().then(function(count) {
            	    if (count) {
                        medal.hasLinks = true;
            	    }
                    return medal;
                });
            });
        };

        self.fetchRelatedMedals = function(medal) {
            return self.getRelatedMedals(medal.id).then(function(relatedMedals) {
                medal.relatedMedals = [];
                if (relatedMedals && relatedMedals.length) {
                    medal.hasLinks = true;
                    relatedMedals.forEach(function(relatedMedal) {
                    		medal.relatedMedals.push(relatedMedal);
                    });
                }
                return medal;
            });
        };

        //	for info page:
        self.fetchRelated = function(medal) {
            var related = [
                self.fetchRelatedMedals(medal),
                self.fetchRelatedPersons(medal)
            ];
            return $q.all(related).then(function() {
                return medal;
            });
        };

		this.getById = function(id) {
            return medalRepository.getById(id);
        };

		this.getRelatedPersons = function(id) {
            return personRepository.getByMedalId(id);
        };

		this.getRelatedMedals = function(id) {
            return medalRepository.getRelatedMedals(id);
        };

        this.countByMedalId = function(id) {
            return personRepository.countByMedalId(id);
        };

        self.getRelatedPersonPager = function(id) {
            return personRepository.getByMedalId(id, Settings.pageSize);
        };
});

