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
    $routeProvider
      .when('/page', {
        templateUrl: 'views/semantic_page.html',
        controller: 'SemanticPageCtrl',
        controllerAs: 'ctrl'
      })
      .when('/events/page', {
        templateUrl: 'views/page.html',
        controller: 'PageCtrl',
        controllerAs: 'ctrl'
      })
      .when('/events/:era?', {
        templateUrl: 'views/simile_map.html',
        controller: 'SimileMapCtrl',
        controllerAs: 'timemapCtrl',
        reloadOnSearch: false
      })
      .when('/units/page', {
        templateUrl: 'views/unit_page.html',
        controller: 'UnitPageCtrl',
        controllerAs: 'ctrl'
      })
      .when('/units/', {
        templateUrl: 'views/actor_timeline.html',
        controller: 'ActorCtrl',
        controllerAs: 'timemapCtrl',
        reloadOnSearch: false
      })
      .when('/times/page', {
        templateUrl: 'views/time_page.html',
        controller: 'TimePageCtrl',
        controllerAs: 'ctrl'
      })
      .otherwise({
        redirectTo: '/events'
      });
  })
  .config(function($locationProvider) {
      $locationProvider.html5Mode(true);
  });
