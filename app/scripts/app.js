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
    'ngTouch'//,
//    'uiGmapgoogle-maps'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/timelinejs', {
        templateUrl: 'views/timelinejs.html',
        controller: 'TimelinejsCtrl',
        controllerAs: 'timeline'
      })
      .when('/map', {
        templateUrl: 'views/map.html',
        controller: 'MapCtrl',
        controllerAs: 'map'
      })
      .when('/similemap', {
        templateUrl: 'views/simile_map.html',
        controller: 'SimileMapCtrl',
        controllerAs: 'simileMap'
      })
      .when('/angulargmaps', {
        templateUrl: 'views/angular_gmaps.html',
        controller: 'AngularGMapsCtrl',
        controllerAs: 'angularGMaps'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
/*
  .config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        libraries: 'weather,geometry,visualization'
  });
})*/
