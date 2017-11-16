(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonPageController', PersonPageController);

    /* @ngInject */
    function PersonPageController($log, $location, $route, _, personService) {
        var self = this;

        self.showHr = showHr;

        init();

        var hrProps = ['other_information', 'memoirs'];

        function init() {
            if ($route.current.locals.uri) {
                self.isLoadingPerson = true;
                self.isLoadingRelated = true;
                personService.getById($route.current.locals.uri)
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

        function showHr(prop) {
            return _.includes(hrProps, prop);
        }
    }
})();
