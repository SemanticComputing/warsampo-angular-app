(function() {

    'use strict';

    /* @ngInject */
    function PhotoModalController($scope, photoService) {
        var vm = this;

        vm.$onInit = function() {
            vm.photo = vm.resolve.photo;
            photoService.fetchRelated(vm.photo);

        };

        vm.close = close;

        function close() {
            $scope.$close();
        }
    }

    angular.module('eventsApp').component('photoModal', {
        templateUrl: 'views/components/photo-modal.component.html',
        controller: PhotoModalController,
        controllerAs: 'vm',
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        }
    });
})();
