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
        
        self.fetchRelated = function(unit) {
            var related = [
                self.fetchUnitEvents(unit),
                self.fetchRelatedUnits(unit),
                self.fetchRelatedPersons(unit),
                self.fetchUnitDiaries(unit)
            ];
            return $q.all(related).then(function() {
                return unit;
            });
        };
			
        self.fetchRelatedUnits = function(unit) {
            return self.getRelatedUnits(unit.id).then(function(units) {
                if (units && units.length) {
                    unit.hasLinks = true;
                    unit.relatedUnits = units;
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
        
        self.fetchRelatedPersons = function(unit) {
            return personRepository.getByUnitId(unit.id).then(function(persons) {
            	var em=new EventMapper(),
                    arr = [],
                    arr2=[];
            	for (var i=0; i<persons.length; i++) {
            		var p=persons[i];
            		if ('label' in p) {
            			if ('rank' in p && p.name.indexOf(' ')<0) {p.name = p.rank +' '+ p.name;}
            			arr.push(p);
	            		if ('role' in p) { 
	            			var pname =p.role+' '+p.name; 
	            			if ('start_time' in p) {
	            				var edate=p.start_time;
	            				var edate2= ('end_time' in p) ? p.end_time : edate;
									edate=em.getExtremeDate(edate, true);
									edate2=em.getExtremeDate(edate2, false);
									edate=em.formatDateRange(edate,edate2);
	            				arr2.push(pname + ', '+edate);
	            			} else { arr2.push(pname); }
	            		}
	            		
	            	}
            	}
            	
            	if (arr.length)  {	unit.relatedPersons = arr; }
            	if (arr2.length) {	unit.commanders = arr2; }

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
            return unitRepository.getActorInfo(ids);
        };
});

