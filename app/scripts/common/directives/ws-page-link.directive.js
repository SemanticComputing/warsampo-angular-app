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
                setSrc(value);
            });

            function setSrc(value) {
                var path, target, params;
                var objId = value;
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
                } else if (_.includes(objId, '/places/') || _.includes(objId, '/pnr/')) {
                    path = 'places/page';
                    target = '_self';
                    params = '&oldMap=true';
                } else {
                    path = 'page';
                    target = '_self';
                }

                var lang = $translate.use();
                var url = lang + '/' + path + '?uri=' + objId + (params ? params : '');
                element.attr('href', url);
                if (target) {
                    element.attr('target', target);
                }
            }
        }
    }
})();
