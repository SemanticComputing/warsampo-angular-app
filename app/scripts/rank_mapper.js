'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Rank() { }

Rank.prototype.getLabel = function() {
	if (_.isArray(this.label)) { this.label= this.label[0]; }
	return this.label;
};

Rank.prototype.getDescription = function() {
	var arr=[];
	if (this.comment) { arr = arr.concat(this.comment); }
	return arr;
};

function RankMapper() {
    this.objectClass = Rank;
}

angular.module('eventsApp')
.factory('rankMapperService', function(objectMapperService) {
    var proto = Object.getPrototypeOf(objectMapperService);
    RankMapper.prototype = angular.extend({}, proto, RankMapper.prototype);

    return new RankMapper();
})
.factory('Rank', function() {
    return Rank;
});

