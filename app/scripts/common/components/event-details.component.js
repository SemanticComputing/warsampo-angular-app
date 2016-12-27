(function() {

    'use strict';

    function EventDetailsController() { }

    angular.module('eventsApp').component('eventDetails', {
        templateUrl: 'views/components/event-details.component.html',
        controller: EventDetailsController,
        bindings: {
            event: '<'
        }
    });
})();
