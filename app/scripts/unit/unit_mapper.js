(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('unitMapperService', function(_, translateableObjectMapperService, Unit) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        UnitMapper.prototype.postProcess = postProcess;
        UnitMapper.prototype = angular.extend({}, proto, UnitMapper.prototype);
        UnitMapper.prototype.objectClass = Unit;

        return new UnitMapper();

        function UnitMapper() { }

        function postProcess(objects) {
            objects.forEach(function(obj) {
                if (!_.isArray(obj.name)) {
                    obj.name = obj.name ? [obj.name] : [];
                }

                if (!_.isArray(obj.abbrev)) {
                    obj.abbrev = obj.abbrev ? [obj.abbrev] : [];
                }

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
        }

        function removeNameAbbrevs(names,abbrevs) {
            var abb2=[];
            for (var i=0; i<abbrevs.length; i++) {
                if (names.indexOf(abbrevs[i])<0) {
                    abb2.push(abbrevs[i]);
                }
            }
            return abb2;
        }

    })
    .factory('Unit', function(TranslateableObject) {
        Unit.prototype = TranslateableObject.prototype;

        return Unit;

        function Unit() { }
    });
})();
