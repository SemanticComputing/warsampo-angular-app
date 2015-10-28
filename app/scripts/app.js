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
      .when('/page.html', {
        templateUrl: 'views/page.html',
        controller: 'PageCtrl',
        controllerAs: 'ctrl'
      })
      .when('/:era?', {
        templateUrl: 'views/simile_map.html',
        controller: 'SimileMapCtrl',
        controllerAs: 'timemapCtrl',
        reloadOnSearch: false
      })
      .otherwise({
        redirectTo: '/'
      });
  });
