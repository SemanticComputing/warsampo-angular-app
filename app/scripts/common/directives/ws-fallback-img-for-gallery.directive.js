(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsFallbackImg', function(_) {
        return {
            restrict:'A',
            link: function(scope, element) {
                element.error(function() {
                    var src;
                    if (element.data('thumbnail')) {
                        src = '/images/no-image-sm.png';
                    } else {
                        src = '/images/no-image.png';
                    }
                    if (!_.includes(element.attr('src'), src)) {
                        element.attr('src', src);
                    } else {
                        element.attr('src', '');
                    }
                });
            }
        };
    });
})();
