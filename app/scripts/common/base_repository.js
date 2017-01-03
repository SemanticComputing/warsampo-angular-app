(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .service('baseRepository', baseRepository);

    /* @ngInject */
    function baseRepository(_) {

        var self = this;

        /* Public API */

        self.uriFy = uriFy;

        function uriFy(id) {
            if (_.isArray(id)) {
                return '<' + id.join('> <') + '>';
            } else if (id) {
                return '<' + id + '>';
            }
            return;
        }
    }
})();
