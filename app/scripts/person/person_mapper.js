(function() {
    'use strict';

    function Person() { }

    function PersonMapper(dateUtilService) {
        this.dateUtilService = dateUtilService;
    }

    PersonMapper.prototype.makeObject = function(obj) {
        var o = new this.objectClass();

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

        if (o.natiobib && (o.natiobib.indexOf('ldf.fi/history') <0 )) { delete o.natiobib; }

        if (o.sname) {
            o.label = o.fname ? o.fname + ' ' + o.sname : o.sname;
        }

        if (o.num_children) {
            var n = parseInt(o.num_children, 10);
            o.num_children = isNaN(n) ? o.num_children : n;
        }

        if (o.wikilink) {
            o.wikilink = [{ id: o.wikilink, label: o.getLabel() }];
        }

        return o;
    };


    angular.module('eventsApp')
    .factory('personMapperService', function(translateableObjectMapperService, Person, dateUtilService) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);
        PersonMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);
        Person.objectClass = Person;

        return new PersonMapper(dateUtilService);
    })
    .factory('Person', function(TranslateableObject) {
        Person.prototype = TranslateableObject.prototype;
        return Person;
    });
})();
