'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Rank() { }

Rank.prototype.getLabel = function() {
	if (_.isArray(this.label)) { this.label= this.label[0]; }
	return this.label;
}



Rank.prototype.getDescription = function() {
	var arr=[];
	// arr=arr.concat(this.);
	if (this.commanders) arr = arr.concat(this.commanders);
	if (this.description) arr = arr.concat(this.description);
	if (this.note) arr = arr.concat(this.note);
	
	var arr2=[];
	for (var i=0; i<arr.length; i++) {
		if (arr2.indexOf(arr[i])<0) arr2.push(arr[i]);
	}
	return arr2;
}




function RankMapper() { }

RankMapper.prototype.makeObject = function(obj) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var o = new Rank();

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });
	 // if (_.isArray(o.note)) { o.note=o.note[0]; }
    return o;
};

angular.module('eventsApp')
.factory('rankMapperService', function(objectMapperService) {
    var proto = Object.getPrototypeOf(objectMapperService);
    RankMapper.prototype = angular.extend({}, proto, RankMapper.prototype);

    return new RankMapper();
})
.factory('Rank', function() {
    return Rank;
});

