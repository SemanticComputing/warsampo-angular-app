(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonDemoController', PersonDemoController);

    /* @ngInject */
    function PersonDemoController($q, $scope, $location, $state, $transition$, $uibModal,
            $translate, _, personService, baseService, Settings) {

        var self = this;

        // Person selection list
        self.items = [];
        // User search input
        self.queryregex = '';

        self.updateSelection = updateSelection;
        self.getItems = getItems;

        init();

        function init() {
            // Timeline settings
            Settings.setHelpFunction(showHelp);

            self.helpTextTitle = 'PERSONS_DEMO.TIMELINE_HELP_TEXT_TITLE';
            self.helpText = 'PERSONS_DEMO.TIMELINE_HELP_TEXT';

            // Cleanup
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
            });

            self.getItems();
        }

        function showHelp() {
            $uibModal.open({
                component: 'helpModal',
                size: 'lg',
                resolve: {
                    title: $translate('PERSONS_DEMO.HELP_TEXT_TITLE'),
                    content: $translate('PERSONS_DEMO.HELP_TEXT')
                }
            });
        }

        // Person selection change
        function updateSelection() {
            if (self.selectedItem && self.selectedItem.id) {
                $location.search('event', null);
                $state.go('app.lang.persons.demo.page.info', {
                    id: baseService.getIdFromUri(self.selectedItem.id) });
            }
        }

        function getItems() {
            var query = '';
            var n = self.queryregex.length;
            if (n < 1) {
                query = 'AA';
            } else if (n < 2) {
                query = self.queryregex + 'A';
            } else {
                query = self.queryregex;
            }
            self.items = [ {id:'#', name:'Etsitään ...'} ];
            return personService.getItems(query).then(function(data) {
                self.items = data.length ? data : [ {id:'#', name:'Ei hakutuloksia.'} ];
            });
        }
    }
})();
