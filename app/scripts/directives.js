'use strict';

angular.module('eventsApp')
.directive('img', function() {
    return {
        restrict:'E',
        link: function(scope, element) {
            element.error(function() {
                var src;
                if (element.data('thumbnail')) {
                    src = 'images/no-image-sm.png';
                } else {
                    src = 'images/no-image.png';
                }
                element.attr('src', src);
            });
        }
    };
});
