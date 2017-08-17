(function() {
    'use strict';

    angular.module('eventsApp')
    .factory('personMapperService', function(translateableObjectMapperService, Person) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        PersonMapper.prototype.reviseObject = reviseObject;
        PersonMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);
        PersonMapper.prototype.objectClass = Person;

        return new PersonMapper();

        function PersonMapper() { }

        function reviseObject(obj, orig) {
            obj = translateableObjectMapperService.reviseObject(obj, orig);

            if (obj.num_children) {
                var n = parseInt(obj.num_children, 10);
                obj.num_children = isNaN(n) ? obj.num_children : n;
            }

            if (obj.wikilink) {
                obj.wikilink = [{ id: obj.wikilink, label: obj.getLabel() }];
            }

            return obj;
        }

    })
    .factory('Person', function(TranslateableObject) {
        Person.prototype.getMetaDescription = getMetaDescription;

        Person.prototype = angular.extend({}, TranslateableObject.prototype, Person.prototype);

        return Person;

        function Person() { }

        function getMetaDescription() {
            if (this.description) {
                return this.description;
            }
            var lifeSpan = '';

            if (this.birth || this.death) {
                lifeSpan = ', ' + (this.birth ? this.birth : '?') +
                    (this.birth_place ? ' ' + this.birth_place : '') + ' \u2013 ' +
                    (this.death ? this.death : '?') +
                    (this.death_place ? ' ' + this.death_place : '');
            }
            var unit = this.cas_unit ? ', ' + this.cas_unit : '';

            return this.label + unit + lifeSpan;
        }
    });
})();
