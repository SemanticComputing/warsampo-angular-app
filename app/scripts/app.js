'use strict';

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
    'truncate'
  ])
  .config(function($routeProvider) {
      var lang = '/:lang?';
    $routeProvider
      .when(lang + '/events/page', {
        templateUrl: 'views/page.html',
        controller: 'PageCtrl',
        controllerAs: 'ctrl'
      })
      .when(lang + '/events/:era?', {
        templateUrl: 'views/simile_map.html',
        controller: 'SimileMapCtrl',
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
        templateUrl: 'views/actor_timeline.html',
        controller: 'ActorCtrl',
        controllerAs: 'timemapCtrl',
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
  });
