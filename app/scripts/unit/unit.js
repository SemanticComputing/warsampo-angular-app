(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service for units.
    */
    angular.module('eventsApp')
    .service('unitService', unitService);

    /* @ngInject */
    function unitService($q, _, unitRepository, eventRepository, photoRepository,
            personRepository, dateUtilService, Settings, PHOTO_PAGE_SIZE, EVENT_TYPES) {

        var self = this;

        self.processUnitEvents = function(unit, events) {
            var battles = [], formations = [], other = [], description = [], places = [];
            events = events || [];
            events.forEach(function(e) {
                var etype = e.type_id,
                    edate = '', eplace = '';
                if (e.start_time && e.end_time) {
                    edate = dateUtilService.formatExtremeDateRange(e.start_time, e.end_time);
                }
                if (e.places) {
                    eplace = ', ' + _.map(e.places, 'label').join(', ');
                }
                if (edate !== '') {
                    edate = edate + ': ';
                }

                switch (etype) {
                    case EVENT_TYPES.BATTLE:
                        battles.push({ label: e.getLabel(), id: e.id });
                        break;
                    case EVENT_TYPES.UNIT_FORMATION:
                        formations.push(edate + 'Perustaminen: ' + e.getLabel() + eplace);
                        break;
                    case EVENT_TYPES.TROOP_MOVEMENT:
                    case EVENT_TYPES.DISSOLUTION:
                        description.push(edate + e.getLabel() + eplace);
                        break;
                    case EVENT_TYPES.MILITARY_ACTIVITY:
                    case EVENT_TYPES.BOMBARDMENT:
                    case EVENT_TYPES.POLITICAL_ACTIVITY:
                        other.push(e);
                        break;
                }

                if (e.places) {
                    places.concat(e.places);
                }
            });

            if (events.length) { unit.hasLinks = true; }

            if (battles) {
                unit.battles = battles;
            }
            if (formations.length) {
                description = formations.concat(description);
            }
            if (description.length) {
                unit.descriptions = description;
            }
            if (other.length) {
                unit.events = other;
            }
        };

        self.fetchRelatedEvents = function(unit) {
            return eventRepository.getByActorId(unit.id).then(function(events) {
                unit.relatedEvents = events;
                return unit;
            });
        };

        self.fetchRelatedPhotos = function(unit) {
            return photoRepository.getByUnitId(unit.id, PHOTO_PAGE_SIZE)
            .then(function(images) {
                unit.images = images;
                return unit.images.getTotalCount();
            }).then(function(count) {
                if (count) {
                    unit.hasLinks = true;
                }
                return unit;
            });
        };

        self.fetchRelated = function(unit, includeSubUnits) {
            var related = [
                self.fetchRelatedUnits(unit),
                self.fetchRelatedPersons(unit),
                self.fetchCommanders(unit),
                self.fetchWikipediaArticles(unit),
                self.fetchRelatedArticles(unit),
                self.fetchRelatedPhotos(unit),
                self.fetchUnitDiaries(unit)
            ];
            if (includeSubUnits) {
                related.push(self.fetchUnitAndSubUnitEvents(unit));
            } else {
                related.push(self.fetchUnitEvents(unit));
            }
            return $q.all(related).then(function() {
                return unit;
            });
        };

        self.fetchRelatedUnits = function(unit) {
            return self.getRelatedUnits(unit.id).then(function(units) {
                unit.superUnits = [];
                unit.relatedUnits = [];
                unit.subUnits = [];
                if (units && units.length) {
                    unit.hasLinks = true;
                    units.forEach(function(relatedUnit) {
                        var level = relatedUnit.level ? parseInt(relatedUnit.level) : 1;
                        switch (level) {
                            case 0: {
                                unit.subUnits.push(relatedUnit);
                                break;
                            } case 1: {
                                unit.relatedUnits.push(relatedUnit);
                                break;
                            } default: {
                                unit.superUnits.push(relatedUnit);
                                break;
                            }
                        }
                    });
                }
                return unit;
            });
        };

        self.fetchUnitEvents = function(unit) {
            return eventRepository.getByActorId(unit.id).then(function(events) {
                if (events && events.length) {
                    self.processUnitEvents(unit, events);
                    unit.hasLinks = true;
                }
                return unit;
            });
        };

        self.fetchUnitAndSubUnitEvents = function(unit) {
            return eventRepository.getUnitAndSubUnitEventsByUnitId(unit.id).then(function(events) {
                if (events && events.length) {
                    self.processUnitEvents(unit, events);
                    unit.hasLinks = true;
                }
                return unit;
            });
        };

        self.fetchCommanders = function(unit) {
            return personRepository.getUnitCommanders(unit.id).then(function(persons) {
                unit.commanders = [];
                persons.forEach(function(p) {
                    var pname = p.role + ' ' + p.label;
                    if (p.join_start) {
                        var edate = dateUtilService.getExtremeDate(p.join_start, true);
                        var edate2 = dateUtilService.getExtremeDate(p.join_end, false);
                        edate = dateUtilService.formatDateRange(edate,edate2);
                        unit.commanders.push(pname + ', ' + edate);
                    } else {
                        unit.commanders.push(pname);
                    }
                });
                return unit;
            });
        };

        self.fetchRelatedPersons = function(unit) {
            return personRepository.getByUnitId(unit.id, Settings.pageSize).then(function(persons) {
                unit.relatedPersons = persons;
                return persons.getTotalCount();
            }).then(function(count) {
                if (count) {
                    unit.hasLinks = true;
                }
                return unit;
            });
        };

        self.fetchRelatedArticles = function(unit) {
            return unitRepository.getUnitArticles(unit.id).then(function(articles) {
                if (articles && articles.length) {
                    unit.articles = articles;
                    unit.hasLinks = true;
                }
            });
        };

        self.fetchWikipediaArticles = function(unit) {
            return unitRepository.getUnitWikipedia(unit.id).then(function(data) {
                if (data && data.length) {
                    unit.wikilink = data;
                    data[0].label = unit.getLabel();
                    unit.hasLinks = true;
                }
            });
        };

        self.fetchUnitDiaries = function(unit) {
            return unitRepository.getUnitDiaries(unit.id).then(function(diaries) {
                if (diaries && diaries.length) {
                    unit.diaries = diaries;
                    unit.hasLinks = true;
                }
            });
        };

        self.getById = function(id) {
            return unitRepository.getById(id).then(function(unit) {
                if (unit.length) {
                    return unit[0];
                }
                return $q.reject('Does not exist');
            });
        };

        self.getByIdList = function(ids) {
            return unitRepository.getByIdList(ids);
        };

        self.getRelatedUnits = function(id) {
            return unitRepository.getRelatedUnits(id);
        };

        self.getSubUnits = function(unit) {
            return unitRepository.getSubUnits(unit);
        };

        self.getItems = function(regx, withEventsOnly) {
            return unitRepository.getItems(regx, withEventsOnly);
        };

        self.getActorInfo = function(ids) {
            return unitRepository.getByUnitId(ids);
        };
    }
})();
