(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsNavbar', wsNavbarDirective);

    /* @ngInject */
    function wsNavbarDirective($templateRequest, $compile, $translate,
            $location, $state, _, supportedLocales, Settings) {

        return {
            link: link,
            controller: NavbarController,
            controllerAs: 'ctrl'
        };

        function link(scope, elem) {
            scope.$watch('ctrl.lang', function(lang) {
                if (lang) {
                    return $templateRequest('/page-templates/navbar-' + lang + '.html.partial')
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

        /* @ngInject */
        function NavbarController($scope, $state) {
            var self = this;

            self.getEventLinksVisibility = getEventLinksVisibility;
            self.getCemeteryLinksVisibility = getCemeteryLinksVisibility;
            self.setCemeteryResultFormat = setCemeteryResultFormat;

            self.toggleSettings = Settings.toggleSettings;
            self.getSettingsVisibility = Settings.getSettingsVisibility;
            self.getHelpButtonVisibility = Settings.getHelpButtonVisibility;
            self.getSettingsButtonVisibility = Settings.getSettingsButtonVisibility;

            self.showHelp = showHelp;

            function showHelp() {
                return Settings.getHelp();
            }

            $scope.$on('$locationChangeSuccess', init);

            function init() {
                return $translate.onReady().then(function() {
                    self.lang = $translate.use();
                });
            }

            function getEventLinksVisibility() {
                return _.includes($location.url(), '/events');
            }

            function getCemeteryLinksVisibility() {
                return _.includes($location.url(), '/cemeteries') && !_.includes($location.url(), '/page') ;
            }

            function setCemeteryResultFormat(resultFormat) {
                $location.search('resultFormat', resultFormat);
            }
        }
    }
})();
