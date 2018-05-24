(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsPageLink', pageLink);

    /* @ngInject */
    function pageLink($translate, _, baseService) {
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
                var oldStyle = false;
                var objId = value;
                if (_.includes(objId, '/times/')) {
                    path = 'times/page/';
                } else if (_.includes(objId, '/events/') || _.includes(objId, '/wikievent')) {
                    path = isDemoLink ? 'events/' : 'events/page/';
                } else if (_.includes(objId, '/photographs/')) {
                    path = isDemoLink ? 'photographs/' : 'photographs/page/';
                } else if (_.includes(objId, '/person_')) {
                    path = 'persons/';
                } else if (_.includes(objId, '/actor_')) {
                    path = isDemoLink ? 'units/' : 'units/page/';
                } else if (_.includes(objId, '/ranks/')) {
                    path = 'ranks/page/';
                } else if (_.includes(objId, '/medals/')) {
                    path = 'medals/page/';
                } else if (_.includes(objId, '/places/') || _.includes(objId, '/pnr/')) {
                    if (_.includes(objId, '/cemeteries/')) {
                        path = isDemoLink ? 'cemeteries/' : 'cemeteries/page/';
                    } else {
                        oldStyle = true;
                        path = isDemoLink ? 'places/' : 'places/page';
                        target = '_self';
                        params = '&oldMap=true';
                    }
                } else {
                    oldStyle = true;
                    path = 'page/';
                    target = '_self';
                }

                var lang = $translate.use();
                var url = lang + '/' + path +
                    (oldStyle ? '?uri=' + encodeURIComponent(objId) : baseService.getIdFromUri(objId)) +
                    (params ? params : '');
                element.attr('href', url);
                if (target) {
                    element.attr('target', target);
                }
            }
        }
    }
})();
