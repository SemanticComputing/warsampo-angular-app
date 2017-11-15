(function() {

    'use strict';

    angular.module('eventsApp')

    .controller('CemeteryDemoController', CemeteryDemoController);

    /* @ngInject */
    function CemeteryDemoController($scope, $translate, $location, $routeParams, _, cemeteryFacetService,
            NgTableParams, FacetHandler, facetUrlStateHandlerService, chartjsService) {

        var vm = this;

        init();

        function init() {
            // URL to controller
            $scope.$on('$locationChangeSuccess', function() {
                updateResultFormat();
            });

            return cemeteryFacetService.getFacets().then(function(facets) {
                vm.facets = facets;

                $scope.$on('sf-facet-constraints', updateResults);

                var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
                    updateResultFormat();
                    updateResults(event, config);
                    initListener();
                });

                return getFacetOptions().then(function(options) {
                    vm.facetOptions = options;
                    vm.facetOptions.scope = $scope;
                    vm.handler = new FacetHandler(vm.facetOptions);
                });
            });
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
            vm.tableParams.reload();
        }

        function updateResultFormat() {
            if ($routeParams.resultFormat) {
                vm.resultFormat = $routeParams.resultFormat;
            } else {
                $location.search('resultFormat', 'list');
                vm.resultFormat = 'list';
            }
        }

        function getFacetOptions() {
            return cemeteryFacetService.getFacetOptions().then(function(options) {
                options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
                return options;
            });
        }

        function getData($defer, params) {
            vm.isLoadingResults = true;

            vm.pager.getPage(params.page() - 1, params.count())
            .then( function( page ) {
                $defer.resolve( page );
                vm.pager.getTotalCount().then(function(count) {
                    vm.tableParams.total( count );
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
                    vm.tableParams.reload();
                } else {
                    initializeTable();
                }
                return pager.getAll();

            })
            .then(function(cemeteries) {
                 vm.cemeteries = cemeteries;
            //    var barChartData = [];
            //     vm.cemeteries.forEach(function(cemetery) {
            //         if (cemetery.number_of_graves) {
            //             barChartData.push({ value: cemetery.number_of_graves,
            //                 label: cemetery.label });
            //         }
            //
            //     });
            //     vm.barChart = chartjsService.createBarChart(barChartData);
            });
        }

    }
})();
