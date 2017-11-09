(function() {

    'use strict';

    angular.module('eventsApp')

    .controller('CemeteryDemoController', CemeteryDemoController);

    /* @ngInject */
    function CemeteryDemoController($scope, cemeteryFacetService, FacetHandler,
            facetUrlStateHandlerService) {

        var vm = this;

        init();

        function init() {
            return cemeteryFacetService.getFacets().then(function(facets) {
                vm.facets = facets;

                return getFacetOptions().then(function(options) {
                    vm.facetOptions = options;
                    vm.facetOptions.scope = $scope;
                    vm.handler = new FacetHandler(vm.facetOptions);
                });
            });
        }

        function getFacetOptions() {
            return cemeteryFacetService.getFacetOptions().then(function(options) {
                options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
                return options;
            });
        }
    }
})();
