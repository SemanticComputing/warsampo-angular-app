(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsJsonLd', function($sce, $filter) {
        return {
            restrict:'AE',
            template: function() {
                return '<script type="application/ld+json" ng-bind-html="onGetJson()"></script>';
            },
            scope: {
                json: '<json'
            },
            link: function(scope) {
                scope.onGetJson = function() {
                    return $sce.trustAsHtml($filter('json')(scope.json));
                };
            }
        };
    });
})();
