(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsInternalLink', function($translate) {
        return {
            restrict:'A',
            link: function(scope, element, attrs) {
                console.log($translate.use());
                attrs.$observe('href', function(val) {
                    var href = $translate.use() + '/' + val;
                    element.attr('href', href);
                });
            }
        };
    });
})();
