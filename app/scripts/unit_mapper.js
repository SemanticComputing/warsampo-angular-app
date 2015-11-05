'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Unit() { }

Unit.prototype.getLabel = function() {
	if (!_.isArray(this.name)) { this.name= [this.name]; }
	if (!_.isArray(this.abbrev)) { this.abbrev= [this.abbrev]; }
		
	this.abbrev=this.removeNameAbbrevs(this.name,this.abbrev);
	/* console.log('Abbrev ',this.abbrev); 
	console.log('Name ', this.name); */
	var label = '';
	if (!_.isArray(this.abbrev)) {
		label = label + this.abbrev;
	} else {
		label = label + this.abbrev.join(', ');
	}
	
	return this.name.join(', ')+ " ("+label+")";
}


Unit.prototype.removeNameAbbrevs=function(names,abbrevs) {
	var abb2=[];
	for (var i=0; i<abbrevs.length; i++) {
		if (names.indexOf(abbrevs[i])<0) {
			abb2.push(abbrevs[i]);
		}	
	}
	return abb2;
}

/*
Unit.prototype.getNotes = function() {
	var notes = '';
	if (!_.isArray(this.note)) {
		notes = this.note;
	} else {
		notes = this.note.join('<br>');
	}
	
	return notes;
}
*/

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

