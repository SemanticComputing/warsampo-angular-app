(function() {

    'use strict';

    /* eslint-disable angular/controller-as */
    angular.module('eventsApp')

    /*
    * Controller for the photo modal.
    */
    .controller( 'PhotoModalController', PhotoModalController );
    /* @ngInject */
    function PhotoModalController($scope, photo, photoService) {
        var vm = this;
        vm.photo = photo;
        photoService.fetchRelated(photo);

        vm.close = close;

        function close() {
            $scope.$close();
        }
    }
})();
