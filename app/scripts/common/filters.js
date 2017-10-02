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
}).filter('castArray', function(_) {
    return function(input) {
        return _.castArray(input);
    };
}).filter('first', function(_) {
    return function(input) {
        return _.isArray(input) ? input[0] : input;
    };
}).filter('dateLike', function(dateFilter) {
    return function(input, format, timezone) {
        return input.match(/\d{4}-\d\d-\d\d/) ? dateFilter(input, format, timezone) : input;
    };
});
