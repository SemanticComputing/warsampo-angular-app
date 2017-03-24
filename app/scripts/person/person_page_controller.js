(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonPageController', PersonPageController)
    .filter('isArray', function() {
        return function (input) {
          return angular.isArray(input);
        };
    });

    /* @ngInject */
    function PersonPageController($routeParams, $q, $rootScope, personService) {
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
