'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('NavCtrl', function($scope, $compile) {
    $("#nav").load("/page-templates/navbar-fi.html", function() {
        $("#subnav").load("events/views/subnav.html", function() {
            $("#nav").attr('done', true);
            $compile(angular.element('#nav').contents())($scope);
        });
    });
    $("#footer").load("/page-templates/footer.html");
});
