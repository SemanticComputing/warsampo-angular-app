(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonPageCtrl', PersonPageController);

    /* @ngInject */
    function PersonPageController($routeParams, $q, $rootScope, eventService, personService) {
        var self = this;

        if ($routeParams.uri) {
            self.isLoadingEvent = true;
            self.isLoadingLinks = false;
            personService.getById($routeParams.uri)
            .then(function(person) {
                self.person = person;
                self.isLoadingEvent = false;

                return personService.fetchRelated(person);
            }).catch(function() {
                self.isLoadingEvent = false;
                self.isLoadingLinks = false;
            });
        }
    }
})();
