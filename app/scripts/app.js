(function() {
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

    var server = 'http://ldf.fi';
    var PNR_SERVICE_URI = '<' + server + '/pnr/sparql>';
    var PNR_ENDPOINT_URL = server + '/pnr/sparql';
    var SPARQL_ENDPOINT_URL = server + '/warsa/sparql';

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
        'pascalprecht.translate',
        'infinite-scroll',
        'sparql',
        'seco.facetedSearch'
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
    .constant('PHOTO_PAGE_SIZE', 50)
    .constant('EVENT_TYPES', {
        BATTLE: 'http://ldf.fi/warsa/events/event_types/Battle',
        POLITICAL_ACTIVITY: 'http://ldf.fi/warsa/events/event_types/PoliticalActivity',
        MILITARY_ACTIVITY: 'http://ldf.fi/warsa/events/event_types/MilitaryActivity',
        BOMBARDMENT: 'http://ldf.fi/warsa/events/event_types/Bombardment',
        TROOP_MOVEMENT: 'http://ldf.fi/warsa/events/event_types/TroopMovement',
        UNIT_JOINING: 'http://ldf.fi/warsa/events/event_types/UnitJoining',
        UNIT_FORMATION: 'http://www.cidoc-crm.org/cidoc-crm/E66_Formation',
        UNIT_NAMING: 'http://ldf.fi/warsa/events/event_types/UnitNaming',
        DISSOLUTION: 'http://www.cidoc-crm.org/cidoc-crm/E68_Dissolution',
        PERSON_JOINING: 'http://ldf.fi/warsa/events/event_types/PersonJoining',
        PROMOTION: 'http://ldf.fi/warsa/events/event_types/Promotion',
        BIRTH: 'http://www.cidoc-crm.org/cidoc-crm/E67_Birth',
        DEATH: 'http://www.cidoc-crm.org/cidoc-crm/E69_Death',
        DISSAPEARING: 'http://ldf.fi/warsa/events/event_types/Dissapearing',
        WOUNDING: 'http://ldf.fi/warsa/events/event_types/Wounding',
        PHOTOGRAPHY: 'http://ldf.fi/warsa/events/event_types/Photography',
        MEDAL_ASSIGNMENT: 'http://www.cidoc-crm.org/cidoc-crm/E13_Attribute_Assignment'
    })
    .constant('SPARQL_ENDPOINT_URL', SPARQL_ENDPOINT_URL)
    .constant('PNR_SERVICE_URI', PNR_SERVICE_URI)
    .constant('PNR_ENDPOINT_URL', PNR_ENDPOINT_URL)
    .constant('ENDPOINT_CONFIG', { endpointUrl: SPARQL_ENDPOINT_URL, usePost: true })
    .constant('PNR_ENDPOINT_CONFIG', { endpointUrl: PNR_ENDPOINT_URL, usePost: true })
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
        .when('/medals/page', {
            redirectTo: '/' + defaultLocale + '/medals/page'
        })
        .when('/units', {
            redirectTo: '/' + defaultLocale + '/units/'
        })
        .when('/persons', {
            redirectTo: '/' + defaultLocale + '/persons/'
        })
        .when('/times/page', {
            redirectTo: '/' + defaultLocale + '/times/page'
        })
        .when('/photographs/page', {
            redirectTo: '/' + defaultLocale + '/photographs/page'
        })
        .when('/photographs', {
            redirectTo: '/' + defaultLocale + '/photographs/'
        })
        .when(lang + '/photographs', {
            templateUrl: 'views/photo_demo.html',
            controller: 'PhotoDemoController',
            controllerAs: 'vm',
            reloadOnSearch: false,
            resolve: getResolve()
        })
        .when('/page', {
            redirectTo: '/' + defaultLocale + '/page'
        })
        .when(lang + '/events/page', {
            templateUrl: 'views/event_page.html',
            controller: 'EventPageController',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/events/:era?', {
            templateUrl: 'views/event_timeline.html',
            controller: 'EventDemoController',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            resolve: getResolve()
        })
        .when(lang + '/units/page', {
            templateUrl: 'views/unit_page.html',
            controller: 'UnitPageController',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/persons/page', {
            templateUrl: 'views/person_page.html',
            controller: 'PersonPageController',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/ranks/page', {
            templateUrl: 'views/rank_page.html',
            controller: 'RankPageController',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/medals/page', {
            templateUrl: 'views/medal_page.html',
            controller: 'MedalPageController',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/units/', {
            templateUrl: 'views/unit_timeline.html',
            controller: 'UnitDemoController',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            resolve: getResolve()
        })
        .when(lang + '/persons/', {
            templateUrl: 'views/person_timeline.html',
            controller: 'PersonDemoController',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            resolve: getResolve()
        })
        .when(lang + '/times/page', {
            templateUrl: 'views/time_page.html',
            controller: 'TimePageController',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/photographs/page', {
            templateUrl: 'views/photo_page.html',
            controller: 'PhotoPageController',
            controllerAs: 'vm',
            resolve: getResolve()
        })
        .when(lang + '/casualties/page', {
            templateUrl: 'views/semantic_page.html',
            controller: 'SemanticPageController',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/page', {
            templateUrl: 'views/semantic_page.html',
            controller: 'SemanticPageController',
            controllerAs: 'ctrl',
            resolve: getResolve()
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
        $translateProvider.addInterpolation('$translateMessageFormatInterpolation');
        $translateProvider.useSanitizeValueStrategy('escapeParameters');
    });

    function getResolve() {
        return { 'checkLang': checkLang };
    }

    /* @ngInject */
    function checkLang($route, $q, $translate, supportedLocales) {
        var lang = $route.current.params.lang;
        if (lang && _.includes(supportedLocales, lang)) {
            return $translate.use(lang);
        }
        return $q.when();
    }
})();
