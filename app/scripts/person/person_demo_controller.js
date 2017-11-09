(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonDemoController', PersonDemoController);

    /* @ngInject */
    function PersonDemoController($q, $scope, $location, $state, $transition$, $uibModal,
            $translate, _, personService, PersonDemoService, Settings) {

        var self = this;
        var demoService = new PersonDemoService();

        var DEFAULT_PERSON = 'person_50';

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
            Settings.setHeatmapUpdater(demoService.updateHeatmap.bind(demoService));

            self.helpTextTitle = 'PERSONS_DEMO.TIMELINE_HELP_TEXT_TITLE';
            self.helpText = 'PERSONS_DEMO.TIMELINE_HELP_TEXT';

            // Cleanup
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
                demoService.cleanUp();
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
                demoService.clear();
                $location.search('event', null);
                $state.go('app.persons.demo.page.info', { id: demoService.getIdFromUri(self.selectedItem.id) });
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
