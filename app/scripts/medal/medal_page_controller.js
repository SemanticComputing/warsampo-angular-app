(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('MedalPageController', MedalPageController);

    /* @ngInject */
    function MedalPageController(medalService, uri) {
        var vm = this;

        if (uri) {
            vm.isLoadingMedal = true;
            medalService.getById(uri)
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
