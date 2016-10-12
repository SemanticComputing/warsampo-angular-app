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
    .constant('PLACE_PARTIAL_QUERY',
    ' { ' +
    '   ?<PLACE_VAR>__id skos:prefLabel ?<PLACE_VAR>__label . ' +
    '   OPTIONAL { ?<PLACE_VAR>__id sch:polygon ?polygon . } ' +
    '   OPTIONAL { ' +
    '     ?<PLACE_VAR>__id geo:lat ?<PLACE_VAR>__point__lat ; ' +
    '        geo:long ?<PLACE_VAR>__point__lon . ' +
    '   } ' +
    '   OPTIONAL { ' +
    '     ?<PLACE_VAR>__id geosparql:sfWithin ?<MUNICIPALITY_VAR>_id . ' +
    '     ?<MUNICIPALITY_VAR>_id a suo:kunta . ' +
    '   } ' +
    ' } UNION { ' +
    '   { ' +
    '     FILTER NOT EXISTS { ' +
    '       ?<PLACE_VAR>__id a ?<PLACE_VAR>__type . ' +
    '     } ' +
    '   } ' +
    '   SERVICE ' + PNR_SERVICE_URI + ' { ' +
    '     ?<PLACE_VAR>__id skos:prefLabel ?<PLACE_VAR>__label . ' +
    '     FILTER(langMatches(lang(?<PLACE_VAR>__label), "FI")) ' +
    '     ?<PLACE_VAR>__id geo:lat ?<PLACE_VAR>__point__lat ; ' +
    '       geo:long ?<PLACE_VAR>__point__lon . ' +
    '     OPTIONAL { ' +
    '       ?<PLACE_VAR>__id crm:P89_falls_within ?<MUNICIPALITY_VAR>_id . ' +
    '       { ?<MUNICIPALITY_VAR>_id a <http://ldf.fi/pnr-schema#place_type_540> } ' +
    '       UNION ' +
    '       { ?<MUNICIPALITY_VAR>_id a <http://ldf.fi/pnr-schema#place_type_550> } ' +
    '     } ' +
    '   } ' +
    ' } ')
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
        PROMOTION: 'http://ldf.fi/warsa/events/event_types/Promotion',
        BIRTH: 'http://www.cidoc-crm.org/cidoc-crm/E67_Birth',
        DEATH: 'http://www.cidoc-crm.org/cidoc-crm/E69_Death',
        DISSAPEARING: 'http://ldf.fi/warsa/events/event_types/Dissapearing',
        MEDAL_ASSIGNMENT: 'http://www.cidoc-crm.org/cidoc-crm/E13_Attribute_Assignment'
    })
    .constant('SPARQL_ENDPOINT_URL', SPARQL_ENDPOINT_URL)
    .constant('PNR_SERVICE_URI', PNR_SERVICE_URI)
    .constant('PNR_ENDPOINT_URL', PNR_ENDPOINT_URL)
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
            templateUrl: 'views/photo_page.html',
            controller: 'PhotoPageCtrl',
            controllerAs: 'vm',
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
