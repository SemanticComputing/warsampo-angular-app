(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('personService', personService);

    /* @ngInject */
    function personService($q, $location, _, baseService, personRepository, eventRepository,
                placeRepository, unitRepository, photoRepository, casualtyRepository,
                prisonerRepository, medalRepository, dateUtilService, Settings,
                EVENT_TYPES, WAR_INFO) {
        var self = this;

        self.processRelatedEvents = processRelatedEvents;
        self.fetchRelatedEvents = fetchRelatedEvents;
        self.fetchDiaries = fetchDiaries;
        self.fetchDeathRecord = fetchDeathRecord;
        self.fetchPrisonerRecord = fetchPrisonerRecord;
        self.fetchMedals = fetchMedals;
        self.fetchRelated = fetchRelated;
        self.fetchRelatedUnits = fetchRelatedUnits;
        self.fetchRelatedPhotos = fetchRelatedPhotos;
        self.fetchRelatedPersons = fetchRelatedPersons;
        self.fetchNationalBib = fetchNationalBib;
        self.fetchTimelineEvents = fetchTimelineEvents;

        self.getById = getById;
        self.getByIdList = getByIdList;
        self.getByUnit = getByUnit;
        self.getNationalBibliography = getNationalBibliography;
        self.getItems = getItems;
        self.getCasualtiesByTimeSpan = getCasualtiesByTimeSpan;
        self.getEventTypes = getEventTypes;

        self.getJsonLd = getJsonLd;

        function getJsonLd(person) {
            var json = {
                '@context': 'http://schema.org',
                '@type': 'Person',
                '@id': person.id,
                'givenName': person.fname,
                'familyName': person.sname,
                'name': person.label,
                'birthDate': _.get(person, 'birthEvent.date'),
                'deathDate': _.get(person, 'birthEvent.date'),
                'birthPlace': person.birth_place,
                'deathPlace': person.death_place,
                'description': person.getDescription()
            };
            if (person.sameAs) {
                json.sameAs = person.sameAs;
            }
            return json;
        }

        function fetchTimelineEvents(person, options) {
            options = options || {};
            var id = [];
            if (options.includeUnitEvents && person.units) {
                id = _.map(person.units, 'id');
            }
            id.push(person.id);
            return eventRepository.getByActorId(id, {
                start: WAR_INFO.winterWarTimeSpan.start,
                end: WAR_INFO.continuationWarTimeSpan.end,
                types: _.map(options.types, 'id')
            })
            .then(function(data) {
                return baseService.getRelated(data, 'place_id', 'places', placeRepository);
            }).then(function(data) {
                if (data && data.length) {
                    person.timelineEvents = data;
                }
                return person;
            });
        }

        function processRelatedEvents(person, events) {
            var eventlist = [];
            var battles = [];
            var articles = [];
            events = events || [];

            events.forEach(function(e) {
                var etype = e.type_id;
                if (etype === EVENT_TYPES.BATTLE) {
                    battles.push(e);
                } else if (etype.indexOf('Article')>-1 ) {
                    articles.push(e);
                } else if (etype !== EVENT_TYPES.PERSON_JOINING) {
                    eventlist.push(e);
                }
            });

            if (eventlist.length) {
                person.hasLinks = true;
                person.events = eventlist;
            }
            if (battles.length) {
                person.hasLinks = true;
                person.battles = battles;
            }
            if (articles.length) {
                person.hasLinks = true;
                person.articles = articles;
            }
            return person;
        }

        function fetchRelatedEvents(person) {
            return eventRepository.getByPersonId(person.id).then(function(events) {
                return self.processRelatedEvents(person, events);
            });
        }

        function fetchDiaries(person) {
            return personRepository.getDiaries(person.id).then(function(diaries) {
                if (diaries && diaries.length) {
                    person.diaries = diaries;
                    person.hasLinks = true;
                }
                return person;
            });
        }

        function fetchMedals(person) {
            return medalRepository.getByPersonId(person.id, { pageSize: Settings.pageSize }).then(function(medals) {
                person.medals = medals;
                return person;
            });
        }

        function fetchDeathRecord(person) {
            return casualtyRepository.getPersonDeathRecord(person.id).then(function(deathRecord) {
                person.deathRecord = deathRecord;
                return person;
            });
        }

        function fetchPrisonerRecord(person) {
            return prisonerRepository.getPersonPrisonerRecord(person.id).then(function(prisonerRecord) {
                person.prisonerRecord = prisonerRecord;
                return person;
            });
        }

        function fetchRelated(person) {
            var related = [
                self.fetchRelatedEvents(person),
                self.fetchRelatedUnits(person),
                self.fetchNationalBib(person),
                self.fetchDeathRecord(person),
                self.fetchPrisonerRecord(person),
                self.fetchRelatedPhotos(person),
                self.fetchDiaries(person),
                self.fetchRelatedPersons(person),
                self.fetchMedals(person)
            ];

            return $q.all(related).then(function() {
                person.jsonLd = self.getJsonLd(person);
                return person;
            });
        }

        function fetchRelatedUnits(person) {
            return unitRepository.getByPersonId(person.id).then(function(units) {
                if (units && units.length) {
                    person.units = units;
                    person.hasLinks = true;
                }
                return person;
            });
        }

        function fetchRelatedPhotos(person) {
            return photoRepository.getByPersonId(person.id, 50).then(function(imgs) {
                person.images = imgs;
                return imgs.getTotalCount();
            }).then(function(count) {
                if (count) {
                    person.hasLinks = true;
                }
                return person;
            });
        }

        function fetchNationalBib(person) {
            return personRepository.getNationalBibliography(person).then(function(nb) {
                if (nb && nb.length && nb[0].id) {
                    nb = nb[0];
                    if (nb.images) {
                        nb.images = nb.images.replace(/^http:\/\//, 'https://ldf.fi/corsproxy/');
                    }
                    person.nationals = nb;
                    person.hasLinks = true;
                }
            });
        }

        function fetchRelatedPersons(person) {
            return personRepository.getRelatedPersons(person.id, Settings.pageSize)
            .then(function(data) {
                if (data) {
                    person.relatedPersons = data;
                    person.hasLinks = true;
                }
            });
        }

        function getByUnit(id) {
            return personRepository.getByUnitId(id);
        }

        function getById(id) {
            return personRepository.getById(id).then(function(person) {
                if (person.length) {
                    return person[0];
                }
                return $q.reject('Does not exist');
            }).then(function(person) {
                var promises = [];
                if (person.birth_id) {
                    promises.push(eventRepository.getById(person.birth_id).then(function(birth) {
                        person.birthEvent = birth;
                    }));
                }
                if (person.death_id) {
                    promises.push(eventRepository.getById(person.death_id).then(function(death) {
                        person.deathEvent = death;
                    }));
                }
                return $q.all(promises).then(function() {
                    var placeIds = _.compact(_.map(
                        _.castArray(person.deathEvent).concat(_.castArray(person.birthEvent)), 'place_id'));
                    if (placeIds.length) {
                        return placeRepository.getById(placeIds).then(function(places) {
                            if (places.length) {
                                if (person.birthEvent) {
                                    baseService.combineRelated(person.birthEvent, places, 'place_id', 'places');
                                }
                                if (person.deathEvent) {
                                    baseService.combineRelated(person.deathEvent, places, 'place_id', 'places');
                                }
                            }
                            return person;
                        });
                    }
                    return person;
                });
            });
        }

        function getByIdList(ids) {
            return personRepository.getByIdList(ids);
        }

        function getCasualtiesByTimeSpan(start, end) {
            return personRepository.getCasualtiesByTimeSpan(start, end);
        }

        function getNationalBibliography(person) {
            return personRepository.getNationalBibliographyByName(person);
        }

        function getItems(regx) {
            return personRepository.getItems(regx);
        }

        function getEventTypes(person, options) {
            var id;
            if (options.includeUnitEvents && person.units) {
                id = [person.id].concat(_.map(person.units, 'id'));
            } else {
                id = person.id;
            }

            return eventRepository.getTypesByActorId(id, options);
        }
    }
})();
