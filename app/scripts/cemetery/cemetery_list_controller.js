(function() {

    'use strict';

    angular.module('eventsApp')

    .controller('CemeteryListController', CemeteryListController);

    /* @ngInject */
    function CemeteryListController($scope, _, NgTableParams, cemeteryFacetService,
            facetUrlStateHandlerService, EVENT_REQUEST_CONSTRAINTS) {

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

        function initializeTable() {
            vm.tableParams = new NgTableParams(
                {
                    count: 25
                },
                {
                    getData: getData
                }
            );

            /*  After updates to sparql faceter, table-pager element was not
                visible when the table was loaded for the first time. Quick fix
                for that is to reload tableParams here
            */
            //vm.tableParams.reload();
        }

        function getData($defer, params) {
            vm.isLoadingResults = true;

            vm.pager.getPage(params.page() - 1, params.count())
            .then(function(page) {
                $defer.resolve(page);
                vm.pager.getTotalCount().then(function(count) {
                    vm.tableParams.total(count);
                }).then(function() {
                    vm.isLoadingResults = false;
                });
            });
        }

        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint, vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);

            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            vm.isLoadingResults = true;
            cemeteryFacetService.getResults(facetSelections)
            .then(function(pager) {
                vm.pager = pager;
                if (vm.tableParams) {
                    vm.tableParams.page(1);
                } else {
                    initializeTable();
                }
                vm.tableParams.reload();
            });
        }
    }
})();
