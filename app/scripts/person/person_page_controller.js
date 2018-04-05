(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonPageController', PersonPageController);

    /* @ngInject */
    function PersonPageController($log, _, personService, person) {
        var self = this;

        init();

        function init() {
            console.log(person)
            if (person) {
                self.isLoadingRelated = true;
                self.person = person;
                return personService.fetchRelated(person).then(function() {
                    self.isLoadingRelated = false;
                }).catch(function(err) {
                    $log.error(err);
                    self.isLoadingPerson = false;
                    self.isLoadingRelated = false;
                });
            }
        }
    }
})();
