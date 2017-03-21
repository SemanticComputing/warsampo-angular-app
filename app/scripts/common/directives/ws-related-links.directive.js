(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsRelatedLinks', relatedLinks);

    /* @ngInject */
    function relatedLinks() {
        var directive = {
            restrict:'E',
            scope: {
                title: '<',
                related: '<'
            },
            link: link,
            templateUrl: 'views/directive/ws-related-links.directive.html'
        };

        return directive;

        function link(scope, element, attrs) {
            if ('external' in attrs) {
                scope.external = true;
            }
        }
    }
})();
