'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Unit() { }

Unit.prototype.getLabel = function() {
	if (!_.isArray(this.name)) { this.name= [this.name]; }
	if (this.name.length>1) {
		var arr=[].concat(this.name), tmp=arr.shift();
      this.altNames=arr;
	}
	
	if (!_.isArray(this.abbrev)) { this.abbrev= [this.abbrev]; }	
	this.abbrev=this.removeNameAbbrevs(this.name,this.abbrev);
	
	var label = '';
	if (!_.isArray(this.abbrev)) {
		label = label + this.abbrev;
	} else {
		label = label + this.abbrev[0];
	}
	if (label !== '') { label=" ("+label+")"; }
	return this.name[0]+ label;
};


Unit.prototype.removeNameAbbrevs=function(names,abbrevs) {
	var abb2=[];
	for (var i=0; i<abbrevs.length; i++) {
		if (names.indexOf(abbrevs[i])<0) {
			abb2.push(abbrevs[i]);
		}	
	}
	return abb2;
};

Unit.prototype.getDescription = function() {
	var arr=[];
	
 	if ('altNames' in this) {
 		for (var i=0; i<this.altNames.length; i++) { 
 			arr.push('Osasto on tunnettu myös nimillä '+this.altNames.join(', ')) ; 
 		}
 	}
 	
	if (this.commanders) {arr = arr.concat(this.commanders); }
	if (this.description) {arr = arr.concat(this.description);}
	if (this.note) {arr = arr.concat(this.note);}
	
	if ('source' in this) { 
		arr.push('Lähde: '+this.source); 
		} else if ('sid' in this) { arr.push('Lähde: '+this.sid); }
	
	var arr2=[];
	for (var i=0; i<arr.length; i++) {
		if (arr2.indexOf(arr[i])<0) { arr2.push(arr[i]);}
	}
	return arr2;
};

Unit.prototype.processUnitEvents = function(events) {
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
	
	if (events.length) { this.hasLinks = true; }
	
	var arr=[];
	for (var pr in battles) arr.push(battles[pr]);
	if (arr.length) { this.battles=arr; }
	
	if (formations.length) {description=formations.concat(description);}
	if (description.length) {this.description=description;}
	
	for (var pr in places) {
		if (!this.places) {this.places=[];}
		this.places.push({label:pr, id:places[pr]});
	}
};



function UnitMapper(class_) {
    this.objectClass = class_;
}

UnitMapper.prototype.postProcess = function(objects) {
    objects.forEach(function(obj) {
        if (_.isArray(obj.label)) {
            obj.label = obj.label[0];
        }
    });

    return objects;
};

angular.module('eventsApp')
.factory('unitMapperService', function(objectMapperService, Unit) {
    var proto = Object.getPrototypeOf(objectMapperService);
    UnitMapper.prototype = angular.extend({}, proto, UnitMapper.prototype);

    return new UnitMapper(Unit);
})
.factory('Unit', function(eventService, personService, unitService) {
        Unit.prototype.fetchRelatedEvents = function() {
            var self = this;
            return eventService.getEventsByActor(self.id).then(function(events) {
                self.relatedEvents = events;
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
			
        Unit.prototype.fetchRelatedUnits = function() {
            var self = this;
            return unitService.getRelatedUnit(self.id).then(function(units) {
                self.relatedUnits = units;
            });
        };
        
        
        Unit.prototype.fetchUnitEvents = function() {
		  		var self = this;
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
    return Unit;
});

