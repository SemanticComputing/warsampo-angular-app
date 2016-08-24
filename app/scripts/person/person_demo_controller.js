(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonDemoCtrl', PersonDemoController);

    /* @ngInject */
    function PersonDemoController($routeParams, $location, personService) {
        var self = this;

        self.items = [];
        self.queryregex = '';

        self.updateByUri = updateByUri;
        self.updateActor = updateActor;
        self.getItems = getItems;

        init();

        function init() {
            self.getItems();

            if ($routeParams.uri) {
                self.updateByUri($routeParams.uri);
            } else {
                self.selectedItem = { name: 'Talvela, Paavo Juho', id: 'http://ldf.fi/warsa/actors/person_50' };
                self.updateActor();
            }
        }

        function updateByUri(uri) {
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
        }

        function getItems() {
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
        }

        function updateActor() {
            if (self.selectedItem && self.selectedItem.id) {
                var uri = self.selectedItem.id;

                if ($location.search().uri != uri) {
                    $location.search('uri', uri);
                }

                self.updateByUri(uri);
            }
        }
    }
})();
