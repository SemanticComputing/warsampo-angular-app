'use strict';

/* global _, google, SimileAjax, TimeMap, TimeMapTheme, Timeline */

/**
 * @ngdoc overview
 * @name eventsApp
 * @description
 * # eventsApp
 *
 * Main module of the application.
 */
angular
.module('eventsApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'truncate',
    'pascalprecht.translate'
])
.constant('_', _)
.constant('google', google)
.constant('SimileAjax', SimileAjax)
.constant('TimeMap', TimeMap)
.constant('TimeMapTheme', TimeMapTheme)
.constant('Timeline', Timeline)
.constant('supportedLocales', ['fi', 'en'])
.constant('defaultLocale', 'fi')
.constant('WAR_INFO',
    {
        winterWarHighlights: [{
            startDate: '1939-11-30',
            endDate: '1940-03-13',
            color:      '#94BFFF',
            opacity:    20,
            startLabel: 'Talvisota',
            endLabel:   '',
            cssClass: 'band-highlight'
        }],
        continuationWarHighlights: [{
            startDate: '1941-06-25',
            endDate: '1944-09-19',
            color:      '#FFC080',
            opacity:    20,
            startLabel: 'Jatkosota',
            endLabel:   '',
            cssClass: 'band-highlight'
        }],
        winterWarTimeSpan: {
            start: '1939-07-01',
            end: '1940-04-30'
        },
        continuationWarTimeSpan: {
            start: '1941-06-01',
            end: '1944-12-31'
        }
    }
)
.config(function($routeProvider, defaultLocale) {
    var lang = '/:lang';
    $routeProvider
    .when('/events/page', {
        redirectTo: '/' + defaultLocale + '/events/page'
    })
    .when('/events/:era?', {
        redirectTo: '/' + defaultLocale + '/events/'
    })
    .when('/units/page', {
        redirectTo: '/' + defaultLocale + '/units/page'
    })
    .when('/persons/page', {
        redirectTo: '/' + defaultLocale + '/persons/page'
    })
    .when('/ranks/page', {
        redirectTo: '/' + defaultLocale + '/ranks/page'
    })
    .when('/units[/]?', {
        redirectTo: '/' + defaultLocale + '/units/'
    })
    .when('/persons[/]?', {
        redirectTo: '/' + defaultLocale + '/persons/'
    })
    .when('/times/page', {
        redirectTo: '/' + defaultLocale + '/times/page'
    })
    .when('/photographs/page', {
        redirectTo: '/' + defaultLocale + '/photographs/page'
    })
    .when('/page', {
        redirectTo: '/' + defaultLocale + '/page'
    })
    .when(lang + '/events/page', {
        templateUrl: 'views/event_page.html',
        controller: 'EventPageCtrl',
        controllerAs: 'ctrl'
    })
    .when(lang + '/events/:era?', {
        templateUrl: 'views/event_timeline.html',
        controller: 'EventDemoCtrl',
        controllerAs: 'timemapCtrl',
        reloadOnSearch: false
    })
    .when(lang + '/units/page', {
        templateUrl: 'views/unit_page.html',
        controller: 'UnitPageCtrl',
        controllerAs: 'ctrl'
    })
    .when(lang + '/persons/page', {
        templateUrl: 'views/person_page.html',
        controller: 'PersonPageCtrl',
        controllerAs: 'ctrl'
    })
    .when(lang + '/ranks/page', {
        templateUrl: 'views/rank_page.html',
        controller: 'RankPageCtrl',
        controllerAs: 'ctrl'
    })
    .when(lang + '/units/', {
        templateUrl: 'views/unit_timeline.html',
        controller: 'UnitDemoCtrl',
        controllerAs: 'ctrl',
        reloadOnSearch: false
    })
    .when(lang + '/persons/', {
        templateUrl: 'views/person_timeline.html',
        controller: 'PersonDemoCtrl',
        controllerAs: 'ctrl',
        reloadOnSearch: false
    })
    .when(lang + '/times/page', {
        templateUrl: 'views/time_page.html',
        controller: 'TimePageCtrl',
        controllerAs: 'ctrl'
    })
    .when(lang + '/photographs/page', {
        templateUrl: 'views/semantic_page.html',
        controller: 'SemanticPageCtrl',
        controllerAs: 'ctrl'
    })
    .when(lang + '/casualties/page', {
        templateUrl: 'views/semantic_page.html',
        controller: 'SemanticPageCtrl',
        controllerAs: 'ctrl'
    })
    .when(lang + '/page', {
        templateUrl: 'views/semantic_page.html',
        controller: 'SemanticPageCtrl',
        controllerAs: 'ctrl'
    })
    .otherwise({
        redirectTo: '/' + defaultLocale + '/events/'
    });
})
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
.config(function($translateProvider, defaultLocale) {
    $translateProvider.useStaticFilesLoader({
        prefix: 'events/lang/locale-',
        suffix: '.json'
    });
    $translateProvider.preferredLanguage(defaultLocale);
    $translateProvider.useSanitizeValueStrategy('escapeParameters');
})
.run(function($rootScope, $route, $routeParams, $translate, _, supportedLocales) {
    $rootScope.$on('$routeChangeSuccess', function() {
        var lang = $route.current.params.lang;
        if (lang && _.contains(supportedLocales, lang)) {
            $translate.use(lang);
        }
    });
});
