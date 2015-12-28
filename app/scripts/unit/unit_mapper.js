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

function UnitMapper() {
    this.objectClass = Unit;
}

UnitMapper.prototype.postProcess = function(objects) {
    objects.forEach(function(obj) {
        if (_.isArray(obj.label)) {
            obj.label = obj.label[0];
        }
    });

    return objects;
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

