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

    var SPARQL_ENDPOINT_URL = '@@WARSAMPO_ENDPOINT_URL';

    var PNR_ENDPOINT_URL = '@@PNR_ENDPOINT_URL';
    var HISTORY_ENDPOINT_URL = '@@HISTORY_ENDPOINT_URL';
    var DBPEDIA_FI_ENDPOINT_URL = '@@DBPEDIA_FI_ENDPOINT_URL';
    var DBPEDIA_ENDPOINT_URL = '@@DBPEDIA_ENDPOINT_URL';

    var PNR_SERVICE_URI = '@@PNR_SERVICE_URI';

    angular
    .module('eventsApp', [
        'ngAnimate',
        'ngAria',
        'ngCookies',
        'ngMessages',
        'ngResource',
        'ui.router',
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
        'updateMeta',
        '720kb.tooltips'
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
            },
            winterWarUri: 'http://ldf.fi/warsa/conflicts/WinterWar',
            continuationWarUri: 'http://ldf.fi/warsa/conflicts/ContinuationWar'
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
    .constant('DBPEDIA_ENDPOINT_CONFIG', { endpointUrl: DBPEDIA_ENDPOINT_URL, usePost: true })
    .constant('DBPEDIA_FI_ENDPOINT_CONFIG', { endpointUrl: DBPEDIA_FI_ENDPOINT_URL, usePost: true })
    .constant('PNR_ENDPOINT_CONFIG', { endpointUrl: PNR_ENDPOINT_URL, usePost: true })

    /* ngInject */
    .config(function($urlMatcherFactoryProvider) {
        $urlMatcherFactoryProvider.strictMode(false);
    })

    /* ngInject */
    .config(function($stateProvider, $urlServiceProvider, _, defaultLocale) {

        $urlServiceProvider.rules.otherwise({ state: 'app.lang.404' });

        // Redirect non-localized urls to default locale
        $urlServiceProvider.rules.when(new RegExp('^/(?!(?:fi|en))(.*)$'), function(match, url) {
            return '/' + defaultLocale + '/' + match[1] + (_.get(url, 'search.uri') ? '?uri=' + url.search.uri : '');
        });
        // Add missing trailing slash to page urls
        $urlServiceProvider.rules.when(new RegExp('^.*/page$'), function(match, url) {
            return match[0] + '/?uri=' + url.search.uri;
        });

        $stateProvider
        .state('app', {
            abstract: true,
            url: ''
        })
        .state('app.lang', {
            abstract: true,
            url: '/{lang}',
            params: {
                lang: defaultLocale
            },
            resolve: { checkLang: checkLang }
        })
        .state('app.lang.404', {
            url: '/404',
            templateUrl: 'views/404.html'
        })
        // Events
        .state('app.lang.events', {
            url: '/events',
            abstract: true,
            redirectTo: 'app.lang.events.demo'
        })
        .state('app.lang.events.page', {
            url: '/page/:id',
            templateUrl: 'views/event_page.html',
            controller: 'EventPageController',
            controllerAs: 'ctrl',
            resolve: { uri: resolveUri }
        })
        .state('app.lang.events.demo', {
            url: '',
            onEnter: function($transition$, $state) {
                var uri = $transition$.params().uri;
                var war = $transition$.params().war;
                if (!$transition$.params().id) {
                    if (!war && !uri) {
                        return $state.target('app.lang.events.demo.war', { war: 'winterwar', lang: $transition$.params().lang });
                    } else if (uri && angular.isUndefined(war)) {
                        return $state.target('app.lang.events.demo.war', { uri: uri, war: '', lang: $transition$.params().lang });
                    }
                }
            }
        })
        .state('app.lang.events.demo.war', {
            url: '/:war?uri',
            params: {
                uri: { dynamic: true }
            },
            templateUrl: 'views/event_timeline.html',
            reloadOnSearch: false,
            controller: 'EventDemoController',
            controllerAs: 'ctrl',
        })
        // Persons
        .state('app.lang.persons', {
            url: '/persons',
            abstract: true,
        })
        .state('app.lang.persons.page', {
            url: '/page/:id',
            templateUrl: 'views/person_page.html',
            controller: 'PersonPageController',
            controllerAs: 'ctrl',
            resolve: { uri: resolveUri },
        })
        .state('app.lang.persons.demo', {
            url: '',
            templateUrl: 'views/person_demo.html',
            controller: 'PersonDemoController',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            redirectTo: 'app.lang.persons.demo.page.info'
        })
        .state('app.lang.persons.demo.page', {
            url: '/{id:string}',
            abstract: true,
            templateUrl: 'views/person_demo_page.html',
            controller: 'PersonDemoPageController',
            controllerAs: 'ctrl',
            resolve: {
                uri: resolveUri,
                person: resolveActor
            },
            params: {
                id: ''
            },
            onEnter: function($transition$, $state) {
                if (!$transition$.params().id) {
                    return $state.target('app.lang.persons.demo.page.info', { lang: $transition$.params().lang, id: 'person_50' });
                }
            }

        })
        .state('app.lang.persons.demo.page.info', {
            url: '?{tab:1}',
            templateUrl: 'views/person_demo_info.html',
            controller: 'PersonPageController',
            controllerAs: 'ctrl',
            params: { tab: '1' }
        })
        .state('app.lang.persons.demo.page.timeline', {
            url: '?{tab:2}&event',
            templateUrl: 'views/person_timeline.html',
            controller: 'PersonTimelineController',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            params: { tab: '2' }
        })
        .state('app.lang.persons.demo.page.photographs', {
            url: '?{tab:3}',
            templateUrl: 'views/person_photos.html',
            controller: 'PersonPhotoController',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            params: { tab: '3' }
        })
        .state('app.lang.persons.demo.page.videos', {
            url: '?{tab:4}',
            templateUrl: 'views/person_videos.html',
            controller: 'PersonVideoController',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            params: { tab: '4' }
        })
        // Units
        .state('app.lang.units', {
            url: '/units',
            abstract: true
        })
        .state('app.lang.units.page', {
            url: '/page/:id',
            templateUrl: 'views/unit_page.html',
            controller: 'UnitPageController',
            controllerAs: 'ctrl',
            resolve: {
                uri: resolveUri,
                person: resolveActor
            },
        })
        .state('app.lang.units.demo', {
            url: '',
            templateUrl: 'views/unit_demo.html',
            controller: 'UnitDemoController',
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            redirectTo: 'app.lang.units.demo.timeline'
        })
        .state('app.lang.units.demo.timeline', {
            url: '/:id?event',
            templateUrl: 'views/unit_timeline.html',
            controller: 'UnitTimelineController',
            resolve: {
                uri: resolveUri,
                unit: resolveActor
            },
            controllerAs: 'ctrl',
            reloadOnSearch: false,
            params: {
                id: ''
            },
            onEnter: function($transition$, $state) {
                if (!$transition$.params().id) {
                    return $state.target('app.lang.units.demo.timeline', {
                        lang: $transition$.params().lang,
                        id: 'actor_940'
                    });
                }
            }
        })
        // Photographs
        .state('app.lang.photographs', {
            url: '/photographs',
            abstract: true,
        })
        .state('app.lang.photographs.demo', {
            url: '',
            templateUrl: 'views/photo_demo.html',
            controller: 'PhotoDemoController',
            controllerAs: 'vm',
            reloadOnSearch: false
        })
        .state('app.lang.photographs.page', {
            url: '/page/:id',
            templateUrl: 'views/photo_page.html',
            controller: 'PhotoPageController',
            controllerAs: 'vm',
            resolve: { uri: resolveUri }
        })
        // Cemeteries
        .state('app.lang.cemeteries', {
            url: '/cemeteries',
            abstract: true
        })
        .state('app.lang.cemeteries.demo', {
            url: '?facets',
            templateUrl: 'views/cemetery_demo.html',
            controller: 'CemeteryDemoController',
            controllerAs: 'vm',
            reloadOnSearch: false,
            redirectTo: 'app.lang.cemeteries.demo.list'
        })
        .state('app.lang.cemeteries.demo.list', {
            url: '/list',
            templateUrl: 'views/partials/cemetery_results_partial.html',
            controller: 'CemeteryListController',
            controllerAs: 'vm'
        })
        .state('app.lang.cemeteries.demo.map', {
            url: '/map',
            templateUrl: 'views/partials/cemetery_map.html',
            controller: 'CemeteryMapController',
            controllerAs: 'vm'
        })
        .state('app.lang.cemeteries.page', {
            url: '/page/:id?',
            templateUrl: 'views/cemetery_page.html',
            controller: 'CemeteryPageController',
            controllerAs: 'vm',
            resolve: { uri: resolveUri }
        })
        // Other pages
        .state('app.lang.ranks', {
            url: '/ranks/page/:id',
            templateUrl: 'views/rank_page.html',
            controller: 'RankPageController',
            controllerAs: 'ctrl',
            resolve: { uri: resolveUri }
        })
        .state('app.lang.medals', {
            url: '/medals/page/:id',
            templateUrl: 'views/medal_page.html',
            controller: 'MedalPageController',
            controllerAs: 'vm',
            resolve: { uri: resolveUri }
        })
        .state('app.lang.times', {
            url: '/times/page/:id',
            templateUrl: 'views/time_page.html',
            controller: 'TimePageController',
            controllerAs: 'ctrl',
            resolve: { uri: resolveUri }
        })
        .state('app.lang.casualties', {
            url: '/casualties/page/:id',
            templateUrl: 'views/semantic_page.html',
            controller: 'SemanticPageController',
            controllerAs: 'ctrl',
            resolve: { uri: resolveUri }
        })
        .state('app.lang.generic', {
            url: '/page?uri',
            templateUrl: 'views/semantic_page.html',
            controller: 'SemanticPageController',
            controllerAs: 'ctrl'
        });
    })
    /* ngInject */
    .config(function($locationProvider) {
        $locationProvider.html5Mode(true);
    })
    /* ngInject */
    .config(function($translateProvider, defaultLocale) {
        $translateProvider.useStaticFilesLoader({
            prefix: 'events/lang/locale-',
            suffix: '.json'
        });
        $translateProvider.preferredLanguage(defaultLocale);
        $translateProvider.addInterpolation('$translateMessageFormatInterpolation');
        $translateProvider.useSanitizeValueStrategy('escapeParameters');
    });

    /* @ngInject */
    function checkLang($transition$, $q, $translate, supportedLocales) {
        var lang = $transition$.params().lang;
        if (lang && _.includes(supportedLocales, lang)) {
            return $translate.use(lang);
        }
        return $q.when();
    }

    var pathToUri = [
        { path: 'persons', uriBase: 'actors/' },
        { path: 'units', uriBase: 'actors/' },
        { path: 'wikievent', uriBase: 'actors/' },
        { path: 'times', uriBase: 'events/times/' },
        { path: 'events', uriBase: 'events/' },
        { path: 'cemeteries', uriBase: 'places/cemeteries/' },
        { path: 'medals', uriBase: 'medals/' },
        { path: 'ranks', uriBase: 'actors/ranks/' },
        { path: 'photographs', uriBase: 'photographs/' },
    ];

    function getUri(path, id) {
        var matchingUriPath = _.find(pathToUri, function(val) {
            return _.includes(path, val.path);
        });
        if (matchingUriPath) {
            var uri = 'http://ldf.fi/warsa/' + matchingUriPath.uriBase + id;
            return uri;
        }
    }

    /* @ngInject */
    function resolveUri($q, $transition$, $state, $location, baseService) {
        // Get URI from short URL, and redirect old style URLs to short URLs
        var id = $transition$.params().id;
        var uriParam = $location.search().uri;
        var uriFromId = getUri($location.path(), id);
        if (uriParam && !id && uriFromId) {
            // Redirect to short url
            $location.search('uri', null);
            $location.path($location.path().replace(/[/]*$/, '/') + baseService.getIdFromUri(uriParam)).replace();
            return $q.reject('Redirected to short URL');
        } else if (id) {
            // Short url
            return uriFromId;
        }
        // Pass through when going to generic page
        return uriParam;
    }

    /* @ngInject */
    function resolveActor($q, $state, $transition$, personService, unitService) {
        if (!$transition$.params().id) {
            return $q.when();
        }
        var uri = 'http://ldf.fi/warsa/actors/' + $transition$.params().id;
        var service = _.includes($transition$.targetState().name(), 'persons') ? personService : unitService;
        return service.getById(uri);
    }
})(_, google, SimileAjax, TimeMap, TimeMapTheme, Timeline, Chart); // eslint-disable-line no-undef
