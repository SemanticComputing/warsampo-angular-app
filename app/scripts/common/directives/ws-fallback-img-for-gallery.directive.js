(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsFallbackImgForGallery', function(_) {
        return {
            restrict:'A',
            link: function(scope, element) {
                element.error(function() {
                    var src = '/images/no-image-sm.png';
                    if (!_.includes(element.attr('src'), src)) {
                        element.attr('src', src);
                        var a = element.parent();
                        a.attr('href', '/images/no-image.png');
                        a.attr('target', '_self');
                    } else {
                        element.attr('src', '');
                    }
                });
            }
        };
    });
})();
