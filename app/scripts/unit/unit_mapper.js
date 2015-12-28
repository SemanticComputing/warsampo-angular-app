'use strict';

/*
 * Service for transforming event SPARQL results into objects.
 */

function Unit() { }

function UnitMapper() {
    this.objectClass = Unit;
}

UnitMapper.prototype.makeObject = function(obj) {
    var o = new Unit();

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });

    o.name = o.name ? [o.name] : [];
    o.abbrev = o.abbrev ? [o.abbrev] : [];

    return o;
};

UnitMapper.prototype.postProcess = function(objects) {
    objects.forEach(function(obj) {
        obj.altNames = obj.name.slice();
        obj.altNames.shift();

        obj.abbrev = removeNameAbbrevs(obj.name, obj.abbrev);

        if (_.isArray(obj.label)) {
            obj.label = obj.label[0];
        } else if (!obj.label) {
            if (obj.abbrev.length) {
                obj.label = '{0} ({1})'.format(obj.name[0], obj.abbrev[0]);
            } else {
                obj.label = obj.name[0];
            }
        }
    });

    return objects;
};

function removeNameAbbrevs(names,abbrevs) {
    var abb2=[];
    for (var i=0; i<abbrevs.length; i++) {
        if (names.indexOf(abbrevs[i])<0) {
            abb2.push(abbrevs[i]);
        }
    }
    return abb2;
}


angular.module('eventsApp')
.factory('unitMapperService', function(objectMapperService) {
    var proto = Object.getPrototypeOf(objectMapperService);
    UnitMapper.prototype = angular.extend({}, proto, UnitMapper.prototype);

    return new UnitMapper();
})
.factory('Unit', function() {
    return Unit;
});

