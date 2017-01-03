(function() {

    'use strict';

    function EventDetailsController() {
        var vm = this;
        vm.config = {
            nPhotosText: 'EVENT_DEMO.N_PHOTOGRAPHY_PHOTOS'
        };
    }

    angular.module('eventsApp').component('eventDetails', {
        templateUrl: 'views/components/event-details.component.html',
        controller: EventDetailsController,
        bindings: {
            event: '<'
        }
    });
})();
