(function() {
    'use strict';

    /**
    * @ngdoc function
    * @name eventsApp.controller:MedalPageController
    * @description
    * # MedalPageController
    * Controller of the eventsApp
    */
    angular.module('eventsApp')
    .controller('MedalPageController', MedalPageController);

    /* @ngInject */
    function MedalPageController($routeParams, $q, $rootScope, eventService, medalService) {
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
