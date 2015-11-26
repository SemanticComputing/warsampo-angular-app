'use strict';

/*
 * Service for units.
 */
angular.module('eventsApp')
    .service('unitService', function($q, unitRepository, eventRepository,
                personRepository) {

        var self = this;

        self.processUnitEvents = function(unit, events) {
            var battles= [], formations=[], description=[], places=[];
            var em=new EventMapper();
            for (var i=0; i<events.length; i++) {
                var e=events[i], 
                    etype=e.type_id, 
                    edate='', edate2='', eplace=''; 
                if (e.start_time && e.end_time) {
                    edate=e.start_time; edate2=e.end_time;
                    edate=em.getExtremeDate(edate, true);
                    edate2=em.getExtremeDate(edate2, false);
                    edate=em.formatDateRange(edate,edate2);
                }
                if (e.places) {
                    eplace=', ' + _.pluck(e.places, 'label').join(', ');
                }
                if (edate!=='') {edate=edate+': ';}
                
                if (etype.indexOf('Battle') > -1) {
                    battles.push({ label: e.label, id: e.id });
                } else if (etype.indexOf('Formation') > -1) {
                    formations.push(edate + 'Perustaminen: ' + e.label + eplace);
                } else if (etype.indexOf('TroopMovement') > -1) {
                    description.push(edate + e.label + eplace);
                } 

                if (e.places) {
                    places.concat(e.places);
                }
            }

            if (events.length) { unit.hasLinks = true; }
            
            if (battles) {
                unit.battles = battles;
            }
            if (formations.length) {
                description = formations.concat(description);
            }
            if (description.length) {
                unit.description = description;
            }
        };

        self.fetchRelatedEvents = function(unit) {
            return eventRepository.getByActorId(unit.id).then(function(events) {
                unit.relatedEvents = events;
                return unit;
            });
        };
        
        self.fetchRelated = function(unit, includeSubUnits) {
            var related = [
                self.fetchRelatedUnits(unit),
                self.fetchRelatedPersons(unit),
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
                            } case 2: {
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
            return eventRepository.getByUnitId(unit.id).then(function(events) {
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
        
        self.fetchRelatedPersons = function(unit) {
            return personRepository.getByUnitId(unit.id).then(function(persons) {
            	var em=new EventMapper();
                unit.relatedPersons = [];
                unit.commanders = [];
                persons.forEach(function(p) {
                    unit.relatedPersons.push(p);
                    if (p.role) { 
                        var pname = p.role + ' ' + p.label; 
                        if (p.join_start) {
                            var edate=em.getExtremeDate(p.join_start, true);
                            var edate2=em.getExtremeDate(p.join_end, false);
                            edate=em.formatDateRange(edate,edate2);
                            unit.commanders.push(pname + ', ' + edate);
                        } else {
                            unit.commanders.push(pname);
                        }
                    }
            	});

                return unit;
            });
        };

        self.fetchUnitDiaries = function(unit) {
            return unitRepository.getUnitDiaries(unit.id).then(function(diaries) {
            	if (diaries && diaries.length) {
                    unit.diaries = diaries;
                }
            });
        };

		this.getById = function(id) {
            return unitRepository.getById(id);
        };

        this.getByIdList = function(ids) {
            return unitRepository.getByIdList(ids);
        };

		this.getRelatedUnits = function(id) {
            return unitRepository.getRelatedUnits(id);
        };
     
        this.getSubUnits = function(unit) {
            return unitRepository.getSubUnits(unit);
        };
        
        this.getItems = function (regx, controller) {
            return unitRepository.getItems(regx, controller);
        };
        
        this.getActorInfo = function(ids) {
            return unitRepository.getByUnitId(ids);
        };
});

