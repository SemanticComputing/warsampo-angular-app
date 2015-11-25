'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Person() { }


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
			res.push(_.capitalize(this.way_to_die)); }
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
	return arr;
};

function PersonMapper() {
    this.objectClass = Person;
}

PersonMapper.prototype.makeObject = function(obj) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var o = new Person();

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });

    o.birth_place = o.birth_place || '';
    o.death_place= o.death_place || '';
    
    o.label = o.fname ? o.fname + ' ' + o.sname : o.sname;

    var places = [];

    if (o.birth_place) {
        places.push({ id: o.birth_place_uri, label: o.birth_place });
    }
    if (o.death_place) {
        places.push({ id: o.death_place_uri, label: o.death_place });
    }
    if (o.bury_place) {
        places.push({ id: o.bury_place_uri, label: o.bury_place });
    }
    if (o.living_place) {
        places.push({ id: o.living_place_uri, label: o.living_place });
    }

    o.places = _.uniq(places, 'id');
    
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

