(function() {

    'use strict';

    /* @ngInject */
    function PersonGroupModalController($scope) {
        var vm = this;

        vm.$onInit = function() {
            vm.unitChart = false;
            vm.rankChart = false;
            vm.wayChart = false;
            vm.ageChart = false;
            vm.others = false;
            vm.persons = vm.resolve.persons;
            vm.cemetery = vm.resolve.cemetery;
            vm.group = vm.resolve.group;
            vm.chartTitle = vm.resolve.chartTitle;

            if (vm.chartTitle == 'unitChart') {
                vm.unitChart = true;
            } else if (vm.chartTitle == 'rankChart') {
                vm.rankChart = true;
            } else if (vm.chartTitle == 'ageChart') {
                vm.ageChart = true;
            } else if (vm.chartTitle == 'wayChart') {
                vm.wayChart = true;
            }

            if (vm.resolve.groupId == null) {
                vm.groupId = '';
            } else {
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
