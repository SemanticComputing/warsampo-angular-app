(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonDemoPageController', PersonDemoPageController);

    /* @ngInject */
    function PersonDemoPageController($q, $scope, $location, $state, $transition$, $uibModal,
            $translate, _, personService, PersonDemoService, Settings, person) {

        var self = this;

        init();

        // Get person details, and update timemap if needed.
        function init() {
            self.isLoadingObject = false;
            self.isLoadingLinks = true;
            self.isLoadingTimeline = true;
            self.personId = person.id;
            self.person = person;
            return personService.fetchRelated(person)
            .then(function(person) {
                self.isLoadingLinks = false;
                self.err = undefined;
                return person;
            }).catch(function(err) {
                if (err === 'NO_EVENTS') {
                    self.noEvents = true;
                } else {
                    self.err = err;
                }
                self.isLoadingObject = false;
                self.isLoadingLinks = false;
                self.isLoadingEvent = false;
                self.isLoadingTimeline = false;
            });
        }
    }
})();
