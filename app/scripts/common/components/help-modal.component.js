(function() {

    'use strict';

    /* @ngInject */
    function HelpModalController($scope) {
        var vm = this;

        vm.$onInit = function() {
            vm.options = vm.resolve.options || { showEventLegend: true };
            vm.content = vm.resolve.content;
            vm.title = vm.resolve.title;
            vm.showEventLegend = vm.options.showEventLegend;
        };

        vm.close = close;

        function close() {
            $scope.$close();
        }
    }

    angular.module('eventsApp').component('helpModal', {
        templateUrl: 'views/components/help-modal.component.html',
        controller: HelpModalController,
        controllerAs: 'vm',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        }
    });
})();
