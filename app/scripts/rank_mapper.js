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
	if (this.comment) arr = arr.concat(this.comment);
	
	return arr;
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

