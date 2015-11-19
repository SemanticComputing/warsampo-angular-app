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
		this.birth_year = edate.getFullYear();
		delete this.birth_time;
	}
	
	if (this.death_time) {
		var edate=em.getExtremeDate(this.death_time, true);
		this.death = em.formatDateRange(edate,edate);
		this.death_year = edate.getFullYear();
		delete this.death_time;
	}
	
	if (this.birth || this.death) {
		var res=this.birth + ' ' + this.birth_place + ' – ' + this.death+ ' ' + this.death_place;
		arr.push(res);
	}
	
	if (this.bury_place || ('way_to_die' in this)) { 
		var res=[];
		if ('way_to_die' in this) { 
			res.push(this.capitalizeFirstLetter(this.way_to_die)); }
		if (this.bury_place) { res.push('Haudattu paikkaan '+this.bury_place+'.'); }
		arr.push(res.join('. '));
	}
	
	if (this.living_place) { arr.push('Asuinkunta: '+this.living_place); }	
	if ('profession' in this) { arr.push('Ammatti: '+this.profession); }	
	if (('mstatus' in this) || ('num_children' in this)) { 
		var res=[ ];
		if ('mstatus' in this) { res.push('Aviosääty: '+this.mstatus); } 
		if ('num_children' in this) { res.push(this.num_children>0 ? 'lapsia '+this.num_children : 'ei lapsia.'); } 
		arr.push(res.join(', '));
	}	
		
	if ('cas_unit' in this) { arr.push('Palvellut joukko-osastossa '+this.cas_unit); }
	
	if (this.rank) { 
		arr.push(this.rank);
	}
	
	arr=arr.concat(this.promotions);
	if (this.note) { 
		arr.push(this.note);
	}
	
	if ('source' in this) { 
		arr.push('Lähde: '+this.source); 
		} else if ('sid' in this) { arr.push('Lähde: '+this.sid); }
	// console.log(this.places);
	// if ('places' in this && this.places.length===0) { delete this.places; }
	return arr;
};

Person.prototype.checkPlace = function (property) {
	if (property in this) {
		var label= this[property];
		var property_uri = property + '_uri';
		//console.log('Added place ',label, this[property_uri]);
		if (property_uri in this) {
			if (!('places' in this)) { this.places = []; }
			for (var i=0; i<this.places.length; i++) { if (this.places[i].label==label) return; }
		
			var newplace = { label:label, id: this[property_uri]};
			this.places.push(newplace);
		}
	} else { this[property]=''; }
}

Person.prototype.capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

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
	
	this.checkPlace('birth_place');
	this.checkPlace('death_place');
	this.checkPlace('bury_place');
	this.checkPlace('living_place');
		
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

PersonMapper.prototype.postProcess = function(people) {
    people.forEach(function(person) {
        if (_.isArray(person.label)) {
            person.label = person.label.join(', ');
        }
    });

    return people;
};

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

