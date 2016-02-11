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
.config(function($routeProvider) {
    var lang = '/:lang?';
    $routeProvider
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
    });/*
      .otherwise({
        redirectTo: '/events'
      });*/
})
.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
.config(function ($translateProvider) {
    // add translation table
    $translateProvider.useStaticFilesLoader({
        prefix: 'lang/locale-',
        suffix: '.json'
    });
    $translateProvider.preferredLanguage('fi');
});
