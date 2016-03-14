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
        'sparql'
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
    .constant('PLACE_PARTIAL_QUERY',
    ' { ' +
    '   ?place_id skos:prefLabel ?place_label . ' +
    '   OPTIONAL { ?place_id sch:polygon ?polygon . } ' +
    '   OPTIONAL { ' +
    '     ?place_id geo:lat ?lat ; ' +
    '        geo:long ?lon . ' +
    '    } ' +
    '    OPTIONAL { ' +
    '      GRAPH <http://ldf.fi/places/karelian_places> { ' +
    '        ?place_id geosparql:sfWithin ?municipality_id . ' +
    '      } ' +
    '      GRAPH <http://ldf.fi/places/municipalities> { ' +
    '        ?municipality_id a suo:kunta . ' +
    '      } ' +
    '    } ' +
    ' } UNION { ' +
    '   SERVICE <http://ldf.fi/pnr/sparql> { ' +
    '     ?place_id skos:prefLabel ?place_label . ' +
    '     FILTER(langMatches(lang(?place_label), "FI")) ' +
    '     ?place_id geo:lat ?lat ; ' +
    '       geo:long ?lon . ' +
    '     OPTIONAL { ' +
    '       ?place_id crm:P89_falls_within  ?municipality_id . ' +
    '       ?municipality_id a ?mt . ' +
    '       FILTER(?mt = <http://ldf.fi/pnr-schema#place_type_540> || ' +
    '           ?mt = <http://ldf.fi/pnr-schema#place_type_550>) ' +
    '     } ' +
    '   } ' +
    ' } ')
    .constant('PHOTO_PAGE_SIZE', 50)
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
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/events/:era?', {
            templateUrl: 'views/event_timeline.html',
            controller: 'EventDemoCtrl',
            controllerAs: 'timemapCtrl',
            reloadOnSearch: false,
            resolve: getResolve()
        })
        .when(lang + '/units/page', {
            templateUrl: 'views/unit_page.html',
            controller: 'UnitPageCtrl',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/persons/page', {
            templateUrl: 'views/person_page.html',
            controller: 'PersonPageCtrl',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/ranks/page', {
            templateUrl: 'views/rank_page.html',
            controller: 'RankPageCtrl',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/medals/page', {
            templateUrl: 'views/medal_page.html',
            controller: 'MedalPageCtrl',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/units/', {
            templateUrl: 'views/unit_timeline.html',
            controller: 'UnitDemoCtrl',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            resolve: getResolve()
        })
        .when(lang + '/persons/', {
            templateUrl: 'views/person_timeline.html',
            controller: 'PersonDemoCtrl',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            resolve: getResolve()
        })
        .when(lang + '/times/page', {
            templateUrl: 'views/time_page.html',
            controller: 'TimePageCtrl',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/photographs/page', {
            templateUrl: 'views/semantic_page.html',
            controller: 'SemanticPageCtrl',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/casualties/page', {
            templateUrl: 'views/semantic_page.html',
            controller: 'SemanticPageCtrl',
            controllerAs: 'ctrl',
            resolve: getResolve()
        })
        .when(lang + '/page', {
            templateUrl: 'views/semantic_page.html',
            controller: 'SemanticPageCtrl',
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
