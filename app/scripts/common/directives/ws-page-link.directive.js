(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsPageLink', pageLink);

    /* @ngInject */
    function pageLink($translate, _) {
        var directive = {
            restrict:'A',
            link: link
        };

        return directive;

        function link(scope, element, attrs) {
            scope.$watch(attrs.wsPageLink, function(value) {
                if (value) {
                    setSrc(value);
                }
            });

            function setSrc(value) {
                var isDemoLink = ('demo' in attrs);
                var path, target, params;
                var objId = value;
                if (_.includes(objId, '/times/')) {
                    path = isDemoLink ? 'time/' : 'times/page';
                } else if (_.includes(objId, '/events/')) {
                    path = isDemoLink ? 'events/' : 'events/page';
                } else if (_.includes(objId, '/photographs/')) {
                    path = isDemoLink ? 'photographs/' : 'photographs/page';
                } else if (_.includes(objId, '/person_')) {
                    path = isDemoLink ? 'persons/' : 'persons/page';
                } else if (_.includes(objId, '/actor_')) {
                    path = isDemoLink ? 'units/' : 'units/page';
                } else if (_.includes(objId, '/ranks/')) {
                    path = isDemoLink ? 'ranks/' : 'ranks/page';
                } else if (_.includes(objId, '/medals/')) {
                    path = isDemoLink ? 'medals/' : 'medals/page';
                } else if (_.includes(objId, '/places/') || _.includes(objId, '/pnr/')) {
                    path = isDemoLink ? 'places/' : 'places/page';
                    target = '_self';
                    params = '&oldMap=true';
                } else {
                    path = 'page';
                    target = '_self';
                }

                var lang = $translate.use();
                var url = lang + '/' + path +
                    '?uri=' + encodeURIComponent(objId) +
                    (params ? params : '');
                element.attr('href', url);
                if (target) {
                    element.attr('target', target);
                }
            }
        }
    }
})();
