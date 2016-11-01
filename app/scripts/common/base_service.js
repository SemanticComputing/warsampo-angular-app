(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .service('baseService', baseService);

    /* @ngInject */
    function baseService($q, _) {
        var self = this;

        self.combineRelated = combineRelated;

        // Non-paged objects only, curently
        function combineRelated(obj, related, idProp, relProp) {
            var relHash = _.keyBy(related, 'id');
            _(obj).castArray().forEach(function(o) {
                o[relProp] = [];
                if (o[idProp]) {
                    var ids = _.castArray(o[idProp]);
                    ids.forEach(function(id) {
                        var rel = relHash[id];
                        if (rel) {
                            o[relProp].push(rel);
                        }
                    });
                }
            });
            return obj;
        }
    }
})();