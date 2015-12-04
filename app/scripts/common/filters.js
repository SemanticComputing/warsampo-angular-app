'use strict';

angular.module('eventsApp')
.filter('concatList', function() {
    return function(input) {
        return _.isArray(input) ? input.join(', ') : input;
    };
});
