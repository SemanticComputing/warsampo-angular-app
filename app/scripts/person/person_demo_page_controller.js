(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonDemoPageController', PersonDemoPageController);

    /* @ngInject */
    function PersonDemoPageController(personService, person) {

        var self = this;

        init();

        // Get person details, and update timemap if needed.
        function init() {
            self.personId = person.id;
            self.person = person;
        }
    }
})();
