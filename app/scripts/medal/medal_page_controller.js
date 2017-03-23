(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('MedalPageController', MedalPageController);

    /* @ngInject */
    function MedalPageController($routeParams, medalService) {
        var vm = this;

        if ($routeParams.uri) {
            vm.isLoadingMedal = true;
            medalService.getById($routeParams.uri)
            .then(function(medal) {
                vm.medal = medal;
                vm.isLoadingMedal = false;
                vm.isLoadingPersons = true;
                return medalService.fetchRelated(medal);
            })
            .then(function() {
                vm.isLoadingLinks = false;
            }).catch(function(err) {
                vm.isLoadingMedal = false;
                vm.isLoadingLinks = false;
                vm.error = err;
            });
        }
    }
})();
