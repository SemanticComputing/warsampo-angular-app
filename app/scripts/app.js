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
      .when('/actors/page', {
        templateUrl: 'views/unit_page.html',
        controller: 'UnitPageCtrl',
        controllerAs: 'ctrl'
      })
      .when('/actors/', {
        templateUrl: 'views/actor_timeline.html',
        controller: 'ActorCtrl',
        controllerAs: 'timemapCtrl',
        reloadOnSearch: false
      })
      .otherwise({
        redirectTo: '/events'
      });
  })
  .config(function($locationProvider) {
      $locationProvider.html5Mode(true);
  });
