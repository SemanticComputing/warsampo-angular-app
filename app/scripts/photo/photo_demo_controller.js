/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('eventsApp')

    /*
    * Controller for the results view.
    */
    .controller( 'PhotoDemoController', PhotoDemoController )
    .controller( 'PhotoModalController', PhotoModalController );

    /* @ngInject */
    function PhotoDemoController( $uibModal, _, photoFacetService,
            facetUrlStateHandlerService ) {
        var vm = this;

        photoFacetService.getFacets().then(function(facets) {
            vm.facets = facets;
        });
        vm.facetOptions = getFacetOptions();

        vm.disableFacets = disableFacets;
        vm.isScrollDisabled = isScrollDisabled;

        vm.nextPage = nextPage;
        vm.openModal = openModal;

        vm.photos = [];

        var nextPageNo;
        var maxPage;

        function openModal(photo) {
            $uibModal.open({
                templateUrl: 'views/partials/photo.modal.html',
                controller: 'PhotoModalController',
                controllerAs: 'vm',
                size: 'lg',
                resolve: {
                    photo: function() { return photo; }
                }
            });
        }

        function getFacetOptions() {
            var options = photoFacetService.getFacetOptions();
            options.updateResults = updateResults;
            options.initialValues = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }

        function disableFacets() {
            return vm.isLoadingResults;
        }

        function nextPage() {
            vm.isLoadingResults = true;
            if (nextPageNo <= maxPage) {
                vm.pager.getPage(nextPageNo++)
                .then(function(page) {
                    vm.photos = vm.photos.concat(page);
                    vm.isLoadingResults = false;
                });
            } else {
                vm.isLoadingResults = false;
            }
        }

        function isScrollDisabled() {
            return vm.isLoadingResults || nextPageNo > maxPage;
        }

        function updateResults( facetSelections ) {
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            vm.isLoadingResults = true;
            vm.photos = [];
            nextPageNo = 0;

            photoFacetService.getResults( facetSelections )
            .then( function ( pager ) {
                vm.pager = pager;
                return vm.pager.getMaxPageNo();
            }).then( function(no) {
                maxPage = no;
                vm.isLoadingResults = false;
                return nextPage();
            });
        }
    }

    /* @ngInject */
    function PhotoModalController(photo, photoService) {
        var vm = this;
        vm.photo = photo;
        photoService.fetchRelated(photo);
    }
})();
