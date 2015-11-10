'use strict';

angular.module('eventsApp')
.directive('fallbackImg', function() {
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
                if (!_.contains(element.attr('src'), src)) {
                    element.attr('src', src);
                } else {
                    element.attr('src', '');
                }
            });
        }
    };
})
.directive('relatedLinks', function() {
    return {
        restrict:'E',
        scope: {
            title: "=",
            related: "="
        },
        templateUrl: "views/link_collapse_partial.html"
    };
})
.directive('pageLink', function() {
    return {
        restrict:'A',
        link: function(scope, element, attrs) {
            var path, target, params;
            var objId = attrs.pageLink;
            if (_.includes(objId, '/times/')) {
                path = 'times/page';
            } else if (_.includes(objId, '/events/')) {
                path = 'events/page';
            } else if (_.includes(objId, '/photographs/')) {
                path = 'photographs/page';
            } else if (_.includes(objId, '/person_')) {
                path = 'persons/page';
            } else if (_.includes(objId, '/actor_')) {
                path = 'units/page';
            } else if (_.includes(objId, '/ranks/')) {
                path = 'ranks/page';
            } else if (_.includes(objId, '/narc-menehtyneet')) {
                path = 'casualties/page';
            } else if (_.includes(objId, '/places/')) {
                path = 'places/page';
                target = '_self';
                params = '&oldMap=true';
            } else {
                path = "page";
                target = "_self";
            }

            var url = path + '?uri=' + objId + (params ? params : '');
            element.attr('href', url);
            if (target) {
                element.attr('target', target);
            }
        }
    };
});
