(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonPageController', PersonPageController);

    /* @ngInject */
    function PersonPageController($routeParams, $q, $rootScope, personService) {
        var self = this;

        if ($routeParams.uri) {
            self.isLoadingEvent = true;
            self.isLoadingRelated = true;
            self.isLoadingLinks = false;
            personService.getById($routeParams.uri)
            .then(function(person) {
                self.person = person;
                self.isLoadingEvent = false;
                return personService.fetchRelated(person);
            })
            .then(function() {
                self.isLoadingRelated = false;

            }).catch(function() {
                self.isLoadingEvent = false;
                self.isLoadingLinks = false;
            });
        }
    }
})();
