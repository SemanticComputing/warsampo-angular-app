(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */

    angular.module('eventsApp')
    /* @ngInject */
    .factory('unitMapperService', function(_, translateableObjectMapperService, Unit) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        UnitMapper.prototype = angular.extend({}, proto, UnitMapper.prototype);
        UnitMapper.prototype.objectClass = Unit;

        return new UnitMapper();

        function UnitMapper() { }
    })
    /* @ngInject */
    .factory('Unit', function(_, TranslateableObject) {
        Object.defineProperty(Unit.prototype, 'wikiLinkList', { get: getWikiList });

        Unit.prototype = angular.extend(Unit.prototype, TranslateableObject.prototype);

        return Unit;

        function Unit() { }

        function getWikiLabel(wikilink) {
            return decodeURIComponent(wikilink.replace(/^.+?\/([^/]+)$/, '$1').replace(/_/g, ' '));
        }

        function getWikiList() {
            var self = this;
            if (!self._wikiList && self.wikilink) {
                if (_.isArray(self.wikilink)) {
                    self._wikiList =  _.map(self.wikilink, function(link) {
                        return { id: link, label: getWikiLabel(link) };
                    });
                } else {
                    self._wikiList = [{ id: self.wikilink, label: getWikiLabel(self.wikilink) }];
                }
            }
            return self._wikiList;
        }
    });
})();
