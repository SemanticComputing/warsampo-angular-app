'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Person() { }


Person.prototype.getLabel = function() {
	var label=this.sname;
	if (!('note' in this)) { this.note='' };
	if (!('rank' in this)) { this.rank='' };
	
	if ('fname' in this && this.fname != '') { 
		label += ', '+this.fname; 
		} 
	return label;
};

Person.prototype.getDescription = function() {
	var arr=[];
	//arr[0]="<a href='link'>test</a>";
	var em=new EventMapper();
	if (this.birth_time) {
		var edate=em.getExtremeDate(this.birth_time, true);
		this.birth = em.formatDateRange(edate,edate);
		delete this.birth_time;
	}
	if (this.death_time) {
		var edate=em.getExtremeDate(this.death_time, true);
		this.death = em.formatDateRange(edate,edate);
		delete this.death_time;
	}
	if (this.birth || this.death) {
		arr.push(this.birth + ' – ' + this.death);
	}
	if (this.rank) { 
		arr.push(this.rank);
	}
	arr=arr.concat(this.promotions);
	if (this.note) { 
		arr.push(this.note);
	}
	
	return arr;
};

Person.prototype.processLifeEvents = function(events) {
	this.promotions=[];
	this.ranks=[];
	if ('rank' in this && 'rankid' in this) {
		this.ranks.push({id:this.rankid, label:this.rank});
	}
	
	var em=new EventMapper();
	for (var i=0; i<events.length; i++) {
		var 	e=events[i], 
				etype=e.idclass, 
				edate=e.start_time, edate2=e.end_time;
		edate=em.getExtremeDate(edate, true);
		edate2=em.getExtremeDate(edate2, false);
		edate=em.formatDateRange(edate,edate2);
		
		if (etype.indexOf('Death')>-1) {
			this.death = edate;
		} else if (etype.indexOf('Birth')>-1) {
			this.birth = edate;
		} else if (etype.indexOf('Promotion')>-1) {
			this.promotions.push(e.rank+' '+edate);
			this.ranks.push({id:e.rankid, label:e.rank});
		}
	}
	if (!this.birth) {this.birth='';}
	if (!this.death) {this.death='';}
	
};

Person.prototype.processRelatedEvents = function(events) {
	var eventlist=[];
	var battles=[];
	var units=[];
	var articles=[];
	
	var em=new EventMapper();
	for (var i=0; i<events.length; i++) {
		var 	e=events[i], 
				etype=e.idclass; 
		
		// if (! ('label' in e)) { e.label=e.description; }
		if (etype.indexOf('Battle')>-1) {
			battles.push(e);
		} else if (etype.indexOf('PersonJoining')>-1) {
			// Linking to unit, not to an event of joining
			if ('unit' in e) e.id = e.unit;
			if ('label' in e && _.isArray(e.label) ) {
         	e.label = e.label[0];
         }
         units.push(e);
		} else if (etype.indexOf('Article')>-1 ) {
			articles.push(e);
		} else {
			eventlist.push(e);
		}
	}
	
	if (eventlist.length) {this.events=eventlist;}
	if (battles.length) {this.battles=battles;}
	if (articles.length) {this.articles=articles;}
	if (units.length) {this.units=units;}
};


function PersonMapper() { }

PersonMapper.prototype.makeObject = function(obj) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var o = new Person();

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });
    
    return o;
};


angular.module('eventsApp')
.factory('personMapperService', function(objectMapperService) {
    var proto = Object.getPrototypeOf(objectMapperService);
    PersonMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);

    return new PersonMapper();
})
.factory('Person', function() {
    return Person;
});

