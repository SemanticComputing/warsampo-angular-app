'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageController
 * @description
 * # PageController
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('TimePageController', function($q, $rootScope, timeService, uri) {
    $rootScope.showSettings = null;
    $rootScope.showHelp = null;
    var self = this;
    if (uri) {
        self.isLoadingObj = true;
        self.isLoadingLinks = true;
        timeService.getById(uri)
        .then(function(time) {
            self.time = time;
            self.isLoadingObj = false;

            return timeService.fetchRelated(time);
        }).then(function() {
            self.isLoadingLinks = false;
        }).catch(function() {
            self.isLoadingObj = false;
            self.isLoadingLinks = false;
        });
    }
});
