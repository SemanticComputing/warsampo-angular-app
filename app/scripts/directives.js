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
})
.directive('pageLink', function() {
    return {
        restrict:'A',
        link: function(scope, element, attrs) {
            var path;
            var target;
            var objId = attrs.id;
            if (_.includes(objId, '/events/')) {
                path = 'events/page';
            } else if (_.includes(objId, '/photographs/')) {
                path = 'photographs/page';
            } else if (_.includes(objId, '/person_')) {
                path = 'persons/page';
            } else if (_.includes(objId, '/unit_')) {
                path = 'units/page';
            } else if (_.includes(objId, '/narc-menehtyneet')) {
                path = 'casualties/page';
            } else if (_.includes(objId, '/places/')) {
                path = 'places/page';
                target = "_self";
            } else {
                path = "page";
            }

            element.attr('href', path + '?uri=' + objId);
            if (target) {
                element.attr('target', target);
            }
        }
    };
});
