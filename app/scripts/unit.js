'use strict';

/*
 * Service for units.
 */
angular.module('eventsApp')
    .service('unitService', function($q, unitRepository, eventRepository,
                unitRepository) {

        var self = this;

        self.fetchRelatedEvents = function(unit) {
            return eventRepository.getByActorId(unit.id).then(function(events) {
                unit.relatedEvents = events;
                return unit;
            });
        };
        
        Unit.prototype.fetchRelated = function() {
            var self = this;
            return self.fetchRelatedEvents().then(
            	function() { return self.fetchUnitEvents(); }).then(
            	function() { return self.fetchRelatedUnits(); }).then(
            	function() { return self.fetchRelatedPersons(); }).then(
            	function() {
                if (self.relatedEvents || self.relatedUnits || self.relatedPersons ) {
                    self.hasLinks = true;
                }
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
        
        Unit.prototype.fetchRelatedPersons = function() {
		  		var self = this;
            return personService.getByUnit(self.id).then(function(persons) {
            	var 	em=new EventMapper(),
            			arr = [], arr2=[];
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
            	
            	if (arr.length)  {	self.relatedPersons = arr; }
            	if (arr2.length) {	self.commanders = arr2; }
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

