(function() {

    'use strict';

    angular.module('eventsApp')

    .controller('CemeteryMapController', CemeteryMapController);

    /* @ngInject */
    function CemeteryMapController($scope, _, cemeteryFacetService, facetUrlStateHandlerService,
            EVENT_REQUEST_CONSTRAINTS) {

        var vm = this;

        init();

        function init() {
            var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
                updateResults(event, config);
                initListener();
            });
            $scope.$on('sf-facet-constraints', updateResults);
            $scope.$emit(EVENT_REQUEST_CONSTRAINTS);  // Request facet selections from facet handler
        }

        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint, vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);

            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            vm.isLoadingResults = true;
            cemeteryFacetService.getResults(facetSelections).then(function(pager) {
                return pager.getAll();
            }).then(function(cemeteries) {
                vm.cemeteries = cemeteries;
            });
        }

    }
})();
