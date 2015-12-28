'use strict';

angular.module('eventsApp')
.filter('concatList', function(_) {
    return function(input) {
        return _.isArray(input) ? input.join(', ') : input;
    };
}).filter('capitalizeFirst', function(_) {
    return function(input) {
        return _.capitalize(input);
    };
});
