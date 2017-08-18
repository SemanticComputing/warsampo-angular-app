(function(_, google, SimileAjax, TimeMap, TimeMapTheme, Timeline, Chart) {
    'use strict';

    /**
    * @ngdoc overview
    * @name eventsApp
    * @description
    * # eventsApp
    *
    * Main module of the application.
    */

    var server = 'https://ldf.fi';
    //var server = 'http://localhost:3030';
    var PNR_SERVICE_URI = '<' + server + '/pnr/sparql>';
    var PNR_ENDPOINT_URL = server + '/pnr/sparql';
    var SPARQL_ENDPOINT_URL = server + '/warsa/sparql';
    var HISTORY_ENDPOINT_URL = server + '/history/sparql';

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
        'ngTable',
        'ui.bootstrap',
        'truncate',
        'pascalprecht.translate',
        'infinite-scroll',
        'sparql',
        'seco.facetedSearch',
        'seco.translateableObjectMapper',
        'chart.js',
        'updateMeta'
    ])
    .constant('_', _)
    .constant('google', google)
    .constant('SimileAjax', SimileAjax)
    .constant('TimeMap', TimeMap)
    .constant('TimeMapTheme', TimeMapTheme)
    .constant('Timeline', Timeline)
    .constant('Chart', Chart)
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
        BATTLE: 'http://ldf.fi/schema/warsa/Battle',
        POLITICAL_ACTIVITY: 'http://ldf.fi/schema/warsa/PoliticalActivity',
        MILITARY_ACTIVITY: 'http://ldf.fi/schema/warsa/MilitaryActivity',
        BOMBARDMENT: 'http://ldf.fi/schema/warsa/Bombardment',
        TROOP_MOVEMENT: 'http://ldf.fi/schema/warsa/TroopMovement',
        UNIT_JOINING: 'http://ldf.fi/schema/warsa/UnitJoining',
        UNIT_FORMATION: 'http://ldf.fi/schema/warsa/UnitFormation',
        UNIT_NAMING: 'http://ldf.fi/schema/warsa/UnitNaming',
        DISSOLUTION: 'http://ldf.fi/schema/warsa/Dissolution',
        PERSON_JOINING: 'http://ldf.fi/schema/warsa/PersonJoining',
        PROMOTION: 'http://ldf.fi/schema/warsa/Promotion',
        BIRTH: 'http://ldf.fi/schema/warsa/Birth',
        DEATH: 'http://ldf.fi/schema/warsa/Death',
        DISSAPEARING: 'http://ldf.fi/schema/warsa/Dissapearing',
        WOUNDING: 'http://ldf.fi/schema/warsa/Wounding',
        PHOTOGRAPHY: 'http://ldf.fi/schema/warsa/Photography',
        MEDAL_ASSIGNMENT: 'http://ldf.fi/schema/warsa/MedalAwarding'
    })
    .constant('SPARQL_ENDPOINT_URL', SPARQL_ENDPOINT_URL)
    .constant('PNR_SERVICE_URI', PNR_SERVICE_URI)
    .constant('PNR_ENDPOINT_URL', PNR_ENDPOINT_URL)
    .constant('HISTORY_ENDPOINT_URL', HISTORY_ENDPOINT_URL)
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
        .when('/cemeteries/page', {
            redirectTo: '/' + defaultLocale + '/cemeteries/page'
        })
        .when('/cemeteries', {
            redirectTo: '/' + defaultLocale + '/cemeteries/'
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
            controllerAs: 'vm',
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

        .when(lang + '/cemeteries', {
            templateUrl: 'views/cemetery_demo.html',
            controller: 'CemeteryDemoController',
            controllerAs: 'vm',
            reloadOnSearch: false,
            resolve: getResolve()
        })
        .when(lang + '/cemeteries/page', {
            templateUrl: 'views/cemetery_page.html',
            controller: 'CemeteryPageController',
            controllerAs: 'vm',
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
})(_, google, SimileAjax, TimeMap, TimeMapTheme, Timeline, Chart); // eslint-disable-line no-undef
