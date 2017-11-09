(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('UnitDemoController', UnitDemoController);

    /* @ngInject */
    function UnitDemoController($state, $location, $scope, $uibModal, $translate,
            unitService, Settings, baseService) {

        var self = this;

        // User search input
        self.queryregex = '';

        self.getItems = getItems;
        self.updateUnit = updateUnit;

        self.casualtyDescription = 'UNIT_DEMO.CASUALTIES_DURING_TIMESPAN';

        init();

        /* Implementation */

        function init() {
            Settings.setHelpFunction(showHelp);
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
            });

            getItems();
        }

        function getItems() {
            var rx = self.queryregex;
            var testAlphabet = /[^.0-9 ]/g;
            var withEventsOnly = false;

            if (rx.length<1) {
                rx='^.*$';
                withEventsOnly = true;
            }
            else if (!testAlphabet.test(rx)) { rx = '^.*'+rx+'.*$'; }
            else if (rx.length<2) { rx='^'+rx; }
            else if (rx.length<5) { rx = '(^|^.* )'+rx+'.*$'; }
            else {
                rx = rx.replace(' ','.*');
                rx = '^.*'+rx+'.*$';
            }

            self.items = [{ id:'#', label: 'Etsitään...' }];

            return unitService.getItems(rx, withEventsOnly).then(function(data) {
                if (data.length) {
                    self.items = data;
                } else {
                    self.items = [{ id:'#', label: 'Ei hakutuloksia.' }];
                }
                return self.items;
            });
        }

        function updateUnit() {
            if (self.currentSelection) {
                $location.search('event', null);
                $state.go('app.lang.units.demo.timeline', {
                    id: baseService.getIdFromUri(self.currentSelection)
                });
            }
        }

        function showHelp() {
            $uibModal.open({
                component: 'helpModal',
                size: 'lg',
                resolve: {
                    title: $translate('UNIT_DEMO.HELP_TEXT_TITLE'),
                    content: $translate('UNIT_DEMO.HELP_TEXT')
                }
            });
        }
    }
})();
