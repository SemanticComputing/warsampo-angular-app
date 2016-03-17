(function() {
    'use strict';

    /**
    * @ngdoc function
    * @name eventsApp.controller:PhotoPageCtrl
    * @description
    * # PhotoPageCtrl
    * Controller of the eventsApp
    */
    angular.module('eventsApp')
    .controller('PhotoPageCtrl', PhotoPageCtrl);

    function PhotoPageCtrl($routeParams, $q, $rootScope, photoService) {
        $rootScope.showSettings = null;
        $rootScope.showHelp = null;
        var vm = this;
        if ($routeParams.uri) {
            vm.isLoadingObj = true;
            vm.isLoadingLinks = true;
            photoService.getById($routeParams.uri)
            .then(function(photo) {
                vm.photo = photo;
                vm.isLoadingObj = false;
                return photoService.fetchRelated(photo);
            }).then(function() {
                vm.isLoadingLinks = false;
            }).catch(function() {
                vm.isLoadingObj = false;
                vm.isLoadingLinks = false;
            });
        }
    }
})();
