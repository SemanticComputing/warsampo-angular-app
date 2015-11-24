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
	
	if (!('abbrev' in this)) { this.abbrev=[''];}
	if (!_.isArray(this.abbrev)) { this.abbrev= [this.abbrev]; }
	this.abbrev=this.removeNameAbbrevs(this.name,this.abbrev);
	
	var label = '';
	if ('abbrev' in this) {
		if (!_.isArray(this.abbrev)) {
			label = label + this.abbrev;
		} else {
			label = label + this.abbrev[0];
		}
		if (label !== '') { label=" ("+label+")"; }
	}
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



function UnitMapper() { }

UnitMapper.prototype.makeObject = function(obj) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var o = new Unit();

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });
	 // if (_.isArray(o.note)) { o.note=o.note[0]; }
    return o;
};

angular.module('eventsApp')
.factory('unitMapperService', function(objectMapperService) {
    var proto = Object.getPrototypeOf(objectMapperService);
    UnitMapper.prototype = angular.extend({}, proto, UnitMapper.prototype);

    return new UnitMapper();
})
.factory('Unit', function() {
    return Unit;
});

