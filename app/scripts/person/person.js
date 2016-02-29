'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
.service('personService', function($q, personRepository, eventRepository,
                unitRepository, photoRepository, dateUtilService) {
    var self = this;

    this.processLifeEvents = function(person, events) {
        person.promotions=[];
        person.ranks=[];
        if (person.rank_id) {
            person.ranks.push({id:person.rank_id, label:person.rank});
        }

        for (var i=0; i<events.length; i++) {
            var e=events[i],
                etype=e.type_id,
                edate=e.start_time,
                edate2=e.end_time;
            edate=dateUtilService.getExtremeDate(edate, true);
            edate2=dateUtilService.getExtremeDate(edate2, false);
            edate=dateUtilService.formatDateRange(edate,edate2);

            if (etype.indexOf('Death')>-1) {
                person.death = edate;
            } else if (etype.indexOf('Birth')>-1) {
                person.birth = edate;
            } else if (etype.indexOf('Promotion')>-1) {
                person.promotions.push(e.rank + ' ' + edate);
                person.ranks.unshift({id:e.rank_id, label:e.rank});
            }
        }
        return person;

    };

    this.processRelatedEvents = function(person, events) {
        var eventlist=[];
        var battles=[];
        var articles=[];

        for (var i=0; i<events.length; i++) {
            var e = events[i],
                etype = e.type_id;

            if (etype.indexOf('Battle')>-1) {
                battles.push(e);
            } else if (etype.indexOf('Article')>-1 ) {
                articles.push(e);
            } else if (etype.indexOf('PersonJoining') === -1) {
                eventlist.push(e);
            }
        }

        if (eventlist.length) {
            person.hasLinks = true;
            person.events=eventlist;
        }
        if (battles.length) {
            person.hasLinks = true;
            person.battles=battles;
        }
        if (articles.length) {
            person.hasLinks = true;
            person.articles=articles;
        }
        return person;
    };

    self.fetchLifeEvents = function(person) {
        return self.getLifeEvents(person.id).then(function(events) {
            self.processLifeEvents(person, events);
        });
    };

    self.fetchRelatedEvents = function(person) {
        return eventRepository.getByPersonId(person.id).then(function(events) {
            return self.processRelatedEvents(person, events);
        });
    };

    // for info page:
    self.fetchRelated = function(person) {
        var related = [
            self.fetchLifeEvents(person),
            self.fetchRelatedEvents(person),
            self.fetchRelatedUnits(person),
            self.fetchNationalBib(person)
        ];

        return $q.all(related).then(function() {
            return person;
        });
    };

    // for demo page:
    self.fetchRelated2 = function(person) {
        var related = [
            self.fetchLifeEvents(person),
            self.fetchRelatedEvents(person),
            self.fetchRelatedUnits(person),
            self.fetchNationalBib(person),
            self.fetchRelatedPhotos(person)
        ];

        return $q.all(related).then(function() {
            return person;
        });
    };

    self.fetchRelatedUnits = function(person) {
        return unitRepository.getByPersonId(person.id).then(function(units) {
            if (units && units.length) {
                person.units = units;
                person.hasLinks = true;
            }
        });
    };

    self.fetchRelatedPhotos = function(person) {
        return photoRepository.getByPersonId(person.id, 50).then(function(imgs) {
            person.images = imgs;
            return imgs.getTotalCount();
        }).then(function(count) {
            if (count) {
                person.hasLinks = true;
            }
            return person;
        });
    };

    self.fetchNationalBib = function(person) {
        return personRepository.getNationalBibliography(person).then(function(nb) {
            if (nb && nb.length && nb[0].id) {
                person.nationals = nb[0];
                person.hasLinks = true;
            }
        });
    };

    this.getByUnit = function(id) {
        return personRepository.getByUnitId(id);
    };

    this.getById = function(id) {
        return personRepository.getById(id);
    };

    this.getByIdList = function(ids) {
        return personRepository.getByIdList(ids);
    };

    this.getCasualtiesByTimeSpan = function(start, end) {
        return personRepository.getCasualtiesByTimeSpan(start, end);
    };

    this.getLifeEvents = function(id) {
        return eventRepository.getPersonLifeEvents(id);
    };

    this.getNationalBibliography = function(person) {
        return personRepository.getNationalBibliographyByName(person);
    };

    this.getItems = function (regx, controller) {
        return personRepository.getItems(regx, controller);
    };
});

