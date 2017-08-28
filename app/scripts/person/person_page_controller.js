(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonPageController', PersonPageController);

    /* @ngInject */
    function PersonPageController($log, $routeParams, personService) {
        var self = this;

        if ($routeParams.uri) {
            self.isLoadingPerson = true;
            self.isLoadingRelated = true;
            personService.getById($routeParams.uri)
            .then(function(person) {
                self.person = person;
                self.isLoadingPerson = false;
                return personService.fetchRelated(person);
            })
            .then(function() {
                self.isLoadingRelated = false;
            }).catch(function(err) {
                $log.error(err);
                self.isLoadingPerson = false;
                self.isLoadingRelated = false;
            });
        }
    }
})();
