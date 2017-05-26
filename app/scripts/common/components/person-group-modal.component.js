(function() {

    'use strict';

    /* @ngInject */
    function PersonGroupModalController($scope) {
        var vm = this;

        vm.$onInit = function() {
            vm.persons = vm.resolve.persons;
            vm.cemetery = vm.resolve.cemetery;
            vm.group = vm.resolve.group;
            if (vm.resolve.groupId != '') {
                vm.groupId = vm.resolve.groupId;
            }
        };
        vm.close = close;

        function close() {
            $scope.$close();
        }
    }

    angular.module('eventsApp').component('personGroupModal', {
        templateUrl: 'views/components/person-group-modal.component.html',
        controller: PersonGroupModalController,
        controllerAs: 'vm',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        }
    });
})();
