(function() {

    'use strict';

    angular.module('eventsApp').component('prisonerDetailProperty', {
        templateUrl: 'views/components/prisoner-detail-property.component.html',
        bindings: {
            property: '<'
        }
    });
})();
