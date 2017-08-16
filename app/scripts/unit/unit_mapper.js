(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    angular.module('eventsApp')
    .factory('unitMapperService', function(_, translateableObjectMapperService, Unit) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        UnitMapper.prototype = angular.extend({}, proto, UnitMapper.prototype);
        UnitMapper.prototype.objectClass = Unit;

        return new UnitMapper();

        function UnitMapper() { }
    })
    .factory('Unit', function(TranslateableObject) {
        Object.defineProperty(Unit.prototype, 'wikiLinkList', { get: getWikiList });

        Unit.prototype = angular.extend(Unit.prototype, TranslateableObject.prototype);

        return Unit;

        function Unit() { }

        function getWikiList() {
            if (!this._wikiList && this.wikilink) {
                this._wikiList = [{ id: this.wikilink, label: this.getLabel() }];
            }
            return this._wikiList;
        }
    });
})();
