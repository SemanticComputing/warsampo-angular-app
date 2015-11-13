'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Unit() { }

Unit.prototype.getLabel = function() {
	if (!_.isArray(this.name)) { this.name= [this.name]; }
	if (!_.isArray(this.abbrev)) { this.abbrev= [this.abbrev]; }
		
	this.abbrev=this.removeNameAbbrevs(this.name,this.abbrev);
	
	var label = '';
	if (!_.isArray(this.abbrev)) {
		label = label + this.abbrev;
	} else {
		label = label + this.abbrev.join(', ');
	}
	if (label !== '') { label=" ("+label+")"; }
	return this.name.join(', ')+ label;
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
	// arr=arr.concat(this.);
	if (this.commanders) {arr = arr.concat(this.commanders); }
	if (this.description) {arr = arr.concat(this.description);}
	if (this.note) {arr = arr.concat(this.note);}
	
	var arr2=[];
	for (var i=0; i<arr.length; i++) {
		if (arr2.indexOf(arr[i])<0) { arr2.push(arr[i]);}
	}
	return arr2;
};

Unit.prototype.processUnitEvents = function(events) {
	var battles=[], formations=[], description=[], places={};
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
			e.description = e.name;
			battles.push(e);
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
	if (battles.length) { this.battles=battles;}
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

