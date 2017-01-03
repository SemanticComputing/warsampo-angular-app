(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('personService', personService);

    /* @ngInject */
    function personService($q, _, baseService, personRepository, eventRepository,
                    placeRepository, unitRepository, photoRepository, casualtyRepository,
                    dateUtilService, EVENT_TYPES, WAR_INFO) {
        var self = this;

        self.processLifeEvents = processLifeEvents;
        self.processRelatedEvents = processRelatedEvents;
        self.fetchLifeEvents = fetchLifeEvents;
        self.fetchRelatedEvents = fetchRelatedEvents;
        self.fetchDiaries = fetchDiaries;
        self.fetchDeathRecord = fetchDeathRecord;
        self.fetchRelated = fetchRelated;
        self.fetchRelatedForDemo = fetchRelatedForDemo;
        self.fetchRelatedUnits = fetchRelatedUnits;
        self.fetchRelatedPhotos = fetchRelatedPhotos;
        self.fetchNationalBib = fetchNationalBib;
        self.fetchTimelineEvents = fetchTimelineEvents;

        self.getById = getById;
        self.getByIdList = getByIdList;
        self.getByUnit = getByUnit;
        self.getLifeEvents = getLifeEvents;
        self.getNationalBibliography = getNationalBibliography;
        self.getItems = getItems;
        self.getCasualtiesByTimeSpan = getCasualtiesByTimeSpan;
        self.getEventTypes = getEventTypes;


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

        function processLifeEvents(person, events) {
            person.promotions = [];
            person.ranks = [];

            var places  =  [];
            for (var i = 0; i < events.length; i++) {
                var e = events[i],
                    etype = e.type_id,
                    edate, edate2;
                if ('start_time' in e) {
                    edate = e.start_time,
                    edate2 = e.end_time;
                    edate = dateUtilService.getExtremeDate(edate, true);
                    edate2 = dateUtilService.getExtremeDate(edate2, false);
                    edate = dateUtilService.formatDateRange(edate,edate2);
                }
                var eplace  =  '';
                if (e.places && e.places.length) {
                    eplace = e.places[0].label;
                    for (var j = 0; j < e.places.length; j++) {
                        places.push({ id: e.places[j].id, label: e.places[j].label });
                    }
                }
                if (etype === EVENT_TYPES.DEATH) {
                    person.death = edate;
                    if (eplace) person.death_place = eplace;
                } else if (etype === EVENT_TYPES.BIRTH) {
                    person.birth = edate;
                    if (eplace) person.birth_place = eplace;
                } else if (etype === EVENT_TYPES.WOUNDING) {
                    person.wound = edate;
                    if (eplace) {
                        person.wound_place = eplace;
                    }
                } else if (etype === EVENT_TYPES.DISSAPEARING) {
                    person.disapp = edate;
                    if (eplace) {
                        person.disapp_place = eplace;
                    }
                } else if (etype === EVENT_TYPES.PROMOTION) {
                    if (edate) {
                        e.rank.label = e.rank.label + ' ' + edate;
                        person.promotions.push(e.rank.label);
                    }
                    person.ranks.unshift(e.rank);
                }
            }
            person.places = _.uniq(places, 'id');
            return person;

        }

        function processRelatedEvents(person, events) {
            var eventlist=[];
            var battles=[];
            var articles=[];
            var medals=[];

            for (var i=0; i<events.length; i++) {
                var e = events[i],
                    etype = e.type_id;
                if (etype === EVENT_TYPES.BATTLE) {
                    battles.push(e);
                } else if (etype.indexOf('Article')>-1 ) {
                    articles.push(e); //
                } else if (_.get(e, 'medal.id')) {
                    medals.push(e.medal);
                } else if (etype !== EVENT_TYPES.PERSON_JOINING) {
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
        }

        function fetchLifeEvents(person) {
            return self.getLifeEvents(person.id).then(function(events) {
                self.processLifeEvents(person, events);
            });
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
            });
        }

        function fetchDeathRecord(person) {
            return casualtyRepository.getPersonDeathRecord(person.id).then(function(deathRecord) {
                person.deathRecord = deathRecord;
                return person;
            });
        }

        // for info page:
        function fetchRelated(person) {
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
        }

        // for demo page:
        function fetchRelatedForDemo(person, options) {
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
                    person.nationals = nb[0];
                    person.hasLinks = true;
                }
            });
        }

        function getByUnit(id) {
            return personRepository.getByUnitId(id);
        }

        function getById(id) {
            return personRepository.getById(id);
        }

        function getByIdList(ids) {
            return personRepository.getByIdList(ids);
        }

        function getCasualtiesByTimeSpan(start, end) {
            return personRepository.getCasualtiesByTimeSpan(start, end);
        }

        function getLifeEvents(id) {
            return eventRepository.getPersonLifeEvents(id).then(function(events) {
                return fetchPlaces(events);
            });
        }

        function fetchPlaces(event) {
            var placeUris = _(event).castArray().map('place_id').flatten().compact().uniq().value();

            return placeRepository.getById(placeUris).then(function(places) {
                return baseService.combineRelated(event, places, 'place_id', 'places');
            });
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
