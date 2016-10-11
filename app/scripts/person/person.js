(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('personService', personService);

    /* @ngInject */
    function personService($q, _, personRepository, eventRepository,
                    unitRepository, photoRepository, casualtyRepository, dateUtilService) {
        var self = this;

        self.processLifeEvents = function(person, events) {
            person.promotions=[];
            person.ranks=[];

            var places = [];
            for (var i=0; i<events.length; i++) {
                var e=events[i],
                    etype=e.type_id,
                    edate, edate2;
                if ('start_time' in e) {
                    edate=e.start_time,
                    edate2=e.end_time;
                    edate=dateUtilService.getExtremeDate(edate, true);
                    edate2=dateUtilService.getExtremeDate(edate2, false);
                    edate=dateUtilService.formatDateRange(edate,edate2);
                }
                var eplace = '';
                if (e.places && e.places.length) {
                    eplace=e.places[0].label;
                    for (var j=0; j<e.places.length; j++) {
                        places.push({ id: e.places[j].id, label: e.places[j].label });
                    }
                }
                if (etype.indexOf('Death')>-1) {
                    person.death = edate;
                    if (eplace) person.death_place = eplace;
                } else if (etype.indexOf('Birth')>-1) {
                    person.birth = edate;
                    if (eplace) person.birth_place = eplace;
                } else if (etype.indexOf('Wounding')>-1) {
                    person.wound = edate;
                    if (eplace) person.wound_place = eplace;
                } else if (etype.indexOf('Disappearing')>-1) {
                    person.disapp = edate;
                    if (eplace) person.disapp_place = eplace;
                } else if (etype.indexOf('Promotion')>-1) {
                    if (edate) person.promotions.push(e.rank.label + ' ' + edate);
                    person.ranks.unshift(e.rank);
                }
            }
            person.places = _.uniq(places, 'id');
            return person;

        };

        self.processRelatedEvents = function(person, events) {
            var eventlist=[];
            var battles=[];
            var articles=[];
            var medals=[];

            for (var i=0; i<events.length; i++) {
                var e = events[i],
                    etype = e.type_id;

                if (etype.indexOf('Battle')>-1) {
                    battles.push(e);
                } else if (etype.indexOf('Article')>-1 ) {
                    articles.push(e); //
                } else if (etype.indexOf('E13_Attribute_Assignment')>-1 ) {
                    e.id = e.medal;
                    medals.push(e);
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
            if (medals.length) {
                person.hasLinks = true;
                person.medals=medals;
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

        self.fetchDiaries = function(person) {
            return personRepository.getDiaries(person.id).then(function(diaries) {
                if (diaries && diaries.length) {
                    person.diaries = diaries;
                    person.hasLinks = true;
                }
            });
        };

        self.fetchDeathRecord = function(person) {
            return casualtyRepository.getPersonDeathRecord(person.id).then(function(deathRecord) {
                person.deathRecord = deathRecord;
                return person;
            });
        };

        // for info page:
        self.fetchRelated = function(person) {
            var related = [
                self.fetchLifeEvents(person),
                self.fetchRelatedEvents(person),
                self.fetchRelatedUnits(person),
                self.fetchNationalBib(person),
                self.fetchDeathRecord(person),
                self.fetchRelatedPhotos(person),
                self.fetchDiaries(person)
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
                self.fetchRelatedPhotos(person),
                self.fetchDiaries(person)
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

        self.getByUnit = function(id) {
            return personRepository.getByUnitId(id);
        };

        self.getById = function(id) {
            return personRepository.getById(id);
        };

        self.getByIdList = function(ids) {
            return personRepository.getByIdList(ids);
        };

        self.getCasualtiesByTimeSpan = function(start, end) {
            return personRepository.getCasualtiesByTimeSpan(start, end);
        };

        self.getLifeEvents = function(id) {
            return eventRepository.getPersonLifeEvents(id);
        };

        self.getNationalBibliography = function(person) {
            return personRepository.getNationalBibliographyByName(person);
        };

        self.getItems = function (regx, controller) {
            return personRepository.getItems(regx, controller);
        };
    }
})();
