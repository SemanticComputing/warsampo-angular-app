'use strict';

/* 
 * Service for transforming event SPARQL results into objects.
 */

function Person() { }


function PersonMapper(dateUtilService) {
    this.objectClass = Person;
    this.dateUtilService = dateUtilService;
}

PersonMapper.prototype.makeObject = function(obj) {
    // Take the event as received and turn it into an object that
    // is easier to handle.
    // Make the location a list as to support multiple locations per event.
    var o = new Person();

    _.forIn(obj, function(value, key) {
        o[key] = value.value;
    });

	if (o.birth_time) {
		var date = this.dateUtilService.getExtremeDate(o.birth_time, true);
		o.birth = date.toLocaleDateString();
		o.birth_year = date.getFullYear();
		delete o.birth_time;
	}

	if (o.death_time) {
		var date = this.dateUtilService.getExtremeDate(o.death_time, true);
		o.death = date.toLocaleDateString();
		o.death_year = date.getFullYear();
		delete o.death_time;
	}

    o.label = o.fname ? o.fname + ' ' + o.sname : o.sname;
	
    if (o.natiobib && (o.natiobib.indexOf("ldf.fi/history") <0 )) { delete o.natiobib; }
	
    if (o.sname) {
        o.label = o.fname ? o.fname + ' ' + o.sname : o.sname;
    }

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
.factory('personMapperService', function(objectMapperService, dateUtilService) {
    var proto = Object.getPrototypeOf(objectMapperService);
    PersonMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);

    return new PersonMapper(dateUtilService);
})
.factory('Person', function() {
    return Person;
});

