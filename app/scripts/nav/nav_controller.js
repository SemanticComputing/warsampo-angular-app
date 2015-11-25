'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('NavCtrl', function($scope, $compile, $location) {
    $("#nav").load("/page-templates/navbar-fi.html", function() {
        $("#subnav").load("events/views/subnav.html", function() {
            $compile(angular.element('#nav').contents())($scope);
        });
    });
    $("#footer").load("/page-templates/footer.html");

})
.controller('SubNavCtrl', function($rootScope, $location) {
    var self = this;
    self.showEventLinks = _.contains($location.url(), '/events/');
    $rootScope.$on('$locationChangeSuccess', function(event){
        self.showEventLinks = _.contains($location.url(), '/events/');
    });
});
