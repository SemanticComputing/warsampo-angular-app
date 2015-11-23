'use strict';

/*
 * Service for units.
 */
angular.module('eventsApp')
    .service('unitService', function($q, unitRepository, eventRepository,
                personRepository) {

        var self = this;

        self.processUnitEvents = function(unit, events) {
            var battles= {}, formations=[], description=[], places={};
            var em=new EventMapper();
            for (var i=0; i<events.length; i++) {
                var 	e=events[i], 
                        etype=e.idclass, 
                        edate='', edate2='', eplace=''; 
                if ('start_time' in e && 'end_time' in e) {
                    edate=e.start_time; edate2=e.end_time;
                    edate=em.getExtremeDate(edate, true);
                    edate2=em.getExtremeDate(edate2, false);
                    edate=em.formatDateRange(edate,edate2);
                }
                if ('place_label' in e) {
                    eplace=', '+e.place_label;
                }
                if (edate!=='') {edate=edate+': ';}
                
                if (etype.indexOf('Battle')>-1) {
                    battles[e.label] = { label:e.name, id:e.id };
                } else if (etype.indexOf('Formation')>-1) {
                    formations.push(edate+'Perustaminen: '+e.name+eplace);
                } else if (etype.indexOf('TroopMovement')>-1) {
                    description.push(edate+e.name+eplace);
                } 
                
                if ('place_id' in e && 'place_label' in e) {
                    places[e.place_label]=e.place_id;
                    // places.push({id:e.place_id, label:e.place_label});
                }
            }
            
            if (events.length) { unit.hasLinks = true; }
            
            var arr=[];
            for (var pr in battles) arr.push(battles[pr]);
            if (arr.length) { unit.battles=arr; }
            
            if (formations.length) {description=formations.concat(description);}
            if (description.length) {unit.description=description;}
            
            for (var pr in places) {
                if (!unit.places) {unit.places=[];}
                unit.places.push({label:pr, id:places[pr]});
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
                self.fetchRelatedPersons(unit)
            ];
            return $q.all(related).then(function() {
                return unit;
            });
        };
			
        self.fetchRelatedUnits = function(unit) {
            return eventRepository.getByUnitId(unit.id).then(function(units) {
                unit.relatedUnits = units;
                return unit;
            });
        };
        
        
        self.fetchUnitEvents = function() {
            return unitService.getUnitEvents(self.id).then(function(events) {
            	self.processUnitEvents(events);
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
        
		this.getById = function(id) {
            return unitRepository.getById(id);
        };

        this.getByIdList = function(ids) {
            return unitRepository.getByIdList(ids);
        };

		this.getRelatedUnit = function(unit) {
            return unitRepository.getRelatedUnit(unit);
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

