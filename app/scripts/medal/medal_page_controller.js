(function() {
    'use strict';

    /**
    * @ngdoc function
    * @name eventsApp.controller:MedalPageCtrl
    * @description
    * # MedalPageCtrl
    * Controller of the eventsApp
    */
    angular.module('eventsApp')
    .controller('MedalPageCtrl', MedalPageCtrl);

    /* @ngInject */
    function MedalPageCtrl($routeParams, $q, $rootScope, eventService, medalService) {
        $rootScope.showSettings = null;
        $rootScope.showHelp = null;

        var self = this;

        if ($routeParams.uri) {
            self.isLoadingMedal = true;
            medalService.getById($routeParams.uri)
            .then(function(medal) {
                self.medal = medal;
                self.isLoadingMedal = false;
                self.isLoadingPersons = true;
                return medalService.fetchRelated(medal);
            })
            .then(function() {
                self.isLoadingPersons = false;
            }).catch(function() {
                self.isLoadingMedal = false;
                self.isLoadingPersons = false;
            });
        }
    }
})();
