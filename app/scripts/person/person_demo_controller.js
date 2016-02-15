'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PersonDemoCtrl
 * @description
 * # PersonDemoCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('PersonDemoCtrl', function($route, $routeParams, $location, $q, $scope,
              $rootScope, eventService, personService) {

    $rootScope.showSettings = null;
    $rootScope.showHelp = null;

    var self = this;

    self.updateByUri = function(uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = false;
        personService.getById(uri)
    .then(function(person) {
        self.person = person;
        self.isLoadingEvent = false;

        return personService.fetchRelated2(person);
    }).catch(function() {
        self.isLoadingEvent = false;
        self.isLoadingLinks = false;
    });
    };

    self.items = [];
    self.queryregex = '';

    self.getItems = function () {
        var rx='', n=self.queryregex.length;
        if (n<1) {
            rx= '^AA.*$';
        } else if (n<2) {
            rx= '^'+self.queryregex+'A.*$';
        } else {
            rx= self.queryregex;
            if (rx.indexOf(' ')>0) {
                var arr=rx.split(' ');
                rx='';
                for (var i=0; i<arr.length; i++) {
                    rx += '(?=.*'+arr[i]+')';
                }
            }
            rx= '(^|^.* )'+rx+'.*$';
        }
        personService.getItems(rx,self);
    };

    self.getItems();

    self.updateActor = function () {
        if (self.selectedItem && self.selectedItem.id) {
            var uri=self.selectedItem.id;

            if ($location.search().uri != uri) {
                self.noReload = true;
                $location.search('uri', uri);
            }

            self.updateByUri(uri);
        }
    };

    // Set listener to prevent reload when it is not desired.
    $scope.$on('$routeUpdate', function() {
        if (!self.noReload) {
            $route.reload();
        } else {
            self.noReload = false;
        }
    });

    if ($routeParams.uri) {
        self.updateByUri($routeParams.uri);
    } else {
        self.selectedItem = { name: 'Talvela, Paavo Juho', id: 'http://ldf.fi/warsa/actors/person_50' };
        self.updateActor();
    }
});


