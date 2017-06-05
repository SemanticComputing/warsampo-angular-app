/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    angular.module('eventsApp')

    /*
    * Controller for the results view.
    */
    .controller('CemeteryDemoController', CemeteryDemoController);

    /* @ngInject */
    function CemeteryDemoController($scope, $translate, $location, $uibModal, _, cemeteryFacetService,
            NgTableParams, FacetHandler, facetUrlStateHandlerService, chartjsService, Settings) {

        var vm = this;

        vm.labels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
        //vm.series = ['Series A', 'Series B'];

        vm.data = [
          [65, 59, 80, 81, 56, 55, 40],
          [28, 48, 40, 19, 86, 27, 90]
        ];

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResultFormat();
            updateResults(event, config);
            initListener();
        });

        // URL to controller
        $scope.$on('$locationChangeSuccess', function(event) {
            updateResultFormat();
        });

        $scope.$on('sf-facet-constraints', updateResults);

        cemeteryFacetService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

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
            if ( _.includes($location.url(), '/cemeteries') && !_.includes($location.url(), '/page') ) {
                if ($location.search().resultFormat) {
                    vm.resultFormat = $location.search().resultFormat;
                } else {
                    $location.search('resultFormat', 'list');
                    vm.resultFormat = 'list';
                }
            }
        }

        function getFacetOptions() {
            var options = cemeteryFacetService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
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
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            vm.isLoadingResults = true;
            cemeteryFacetService.getResults( facetSelections )
            .then( function ( pager ) {
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
                var barChartData = [];
                vm.cemeteries.forEach(function(cemetery) {
                    barChartData.push({ value: cemetery.number_of_graves,
                                        label: cemetery.label });
                });
                chartjsService.createBarChart(barChartData);


            });
        }


        //function crea

    }
})();
