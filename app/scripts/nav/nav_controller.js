'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('NavCtrl', function($scope, $compile) {
    $('#nav').load('/page-templates/navbar-fi.html', function() {
        $('#subnav').load('events/views/subnav.html', function() {
            $compile(angular.element('#nav').contents())($scope);
        });
    });
    $('#footer').load('/page-templates/footer.html');

})
.controller('SubNavCtrl', function($rootScope, $location, $route, $routeParams,
            $translate, _, supportedLocales) {
    var self = this;
    var lang = $translate.use();
    var base = lang + '/events/';
    self.winterWarLink = base + 'winterwar';
    self.continuationWarLink = base + 'continuationwar';
    self.showEventLinks = _.includes($location.url(), '/events/');

    self.changeLocale = changeLocale;
    self.getLocale = getLocale;

    $rootScope.$on('$locationChangeSuccess', function(event){
        self.showEventLinks = _.includes($location.url(), '/events/');
    });

    function getLocale() {
        return $translate.use();
    }

    function changeLocale(lang) {
        if (_.includes(supportedLocales, lang)) {
            $translate.use(lang);
            $routeParams.lang = lang;
            $route.updateParams($routeParams);
            $route.reload();
        }
    }

});
