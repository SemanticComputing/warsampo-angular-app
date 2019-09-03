(function() {

    'use strict';

    /* @ngInject */
    function PrisonerDetailValueController(_) {
        var hrProps = ['additional_information', 'memoir', 'description_of_capture'];

        var vm = this;

        vm.showHr = showHr;
        vm.isYear = isYear;

        function showHr() {
            return _.includes(hrProps, vm.propertyName);
        }

        function isYear(value) {
            if (!_.isInteger(value)) {
                return false;
            }
            return (value > 1700 && value < 2100);
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
