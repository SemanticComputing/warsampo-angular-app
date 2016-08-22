(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsNavbar', wsNavbarDirective);

    /* @ngInject */
    function wsNavbarDirective($templateRequest, $compile, $translate, $rootScope,
            $route, $location, $routeParams, _, supportedLocales) {
        return {
            link: link,
            controller: NavbarController,
            controllerAs: 'ctrl'
        };

        function link(scope, elem) {
            scope.$watch('ctrl.lang', function(lang) {
                if (lang) {
                    return $templateRequest('/page-templates/navbar-' + lang + '.html')
                    .then(function(template) {
                        elem.html(template);
                        return $templateRequest('events/views/subnav.html');
                    }).then(function(template) {
                        angular.element('#subnav').html(template);
                        return $compile(elem.contents())(scope);
                    });
                }
            });
        }

        function NavbarController() {
            var self = this;

            self.changeLocale = changeLocale;

            $rootScope.$on('$locationChangeSuccess', init);

            function init() {
                return $translate.onReady().then(function() {
                    setEventsUrlDisplay();
                    self.lang = $translate.use();
                    var base = self.lang + '/events/';
                    self.winterWarLink = base + 'winterwar';
                    self.continuationWarLink = base + 'continuationwar';
                });
            }

            function setEventsUrlDisplay() {
                self.showEventLinks = _.includes($location.url(), '/events');
            }

            function changeLocale(lang) {
                if (_.includes(supportedLocales, lang)) {
                    $translate.use(lang);
                    init();
                    $routeParams.lang = lang;
                    $route.updateParams($routeParams);
                }
            }

        }
    }
})();
