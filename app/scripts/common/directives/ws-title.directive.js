(function() {
    'use strict';
    angular.module('eventsApp').directive('wsTitle', function($window, $translate) {
        return {
            restrict: 'EA',
            link: function($scope, $element) {
                var el = $element[0];
                el.hidden = true; // So the text not actually visible on the page

                var text = function() {
                    return el.innerHTML;
                };
                var setTitle = function(title) {
                    $translate('TITLE').then(function(appTitle) {
                        $window.document.title = appTitle + (title ? ' | ' + title : '');
                    });
                };
                $scope.$watch(text, setTitle);
            }
        };
    });
})();
