(function() {

    'use strict';

    /* @ngInject */
    function PrisonerDetailValueController(_) {
        var hrProps = ['other_information', 'memoirs', 'description_of_capture'];

        var vm = this;

        vm.showHr = showHr;

        function showHr() {
            return _.includes(hrProps, vm.propertyName);
        }

    }

    angular.module('eventsApp').component('prisonerDetailValue', {
        templateUrl: 'views/components/prisoner-detail-value.component.html',
        controller: PrisonerDetailValueController,
        bindings: {
            propertyName: '<',
            property: '<',
            isDateValue: '<'
        }
    });
})();
