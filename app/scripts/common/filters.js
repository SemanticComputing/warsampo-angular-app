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
}).filter('isArray', function(_) {
    return function(input) {
        return _.isArray(input);
    };
}).filter('first', function(_) {
    return function(input) {
        return _.isArray(input) ? input[0] : input;
    };
});
