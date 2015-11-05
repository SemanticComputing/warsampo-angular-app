'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Person() { }

Person.prototype.getLabel = function() {
	if (!_.isArray(this.name)) { this.name= [this.name]; }
	if (!_.isArray(this.abbrev)) { this.abbrev= [this.abbrev]; }
	
	return this.fname + ' ' +this.sname;
	
	/* console.log('Abbrev ',this.abbrev);
	console.log('Name ', this.name); */
	var label = '';
	if (!_.isArray(this.abbrev)) {
		label = label + this.abbrev;
	} else {
		label = label + this.abbrev.join(', ');
	}
	if (label != '') { label=" ("+label+")"; }
	return this.name.join(', ')+ label;
}


Person.prototype.removeNameAbbrevs=function(names,abbrevs) {
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

function PersonMapper() { }

PersonMapper.prototype.makeObject = function(obj) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var o = new Person();

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });
	 // if (_.isArray(o.note)) { o.note=o.note[0]; }
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

