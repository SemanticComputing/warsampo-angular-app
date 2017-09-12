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
    .controller('PhotoDemoController', PhotoDemoController);

    /* @ngInject */
    function PhotoDemoController($scope, $translate, $uibModal, _, photoFacetService,
            FacetHandler, facetUrlStateHandlerService, Settings) {
        var vm = this;

        vm.disableFacets = disableFacets;
        vm.isScrollDisabled = isScrollDisabled;

        vm.nextPage = nextPage;
        vm.openModal = openModal;

        vm.photos;

        var nextPageNo;
        var maxPage;

        init();

        function init() {
            Settings.setHelpFunction(showHelp);

            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
            });

            photoFacetService.getFacets().then(function(facets) {
                var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
                    updateResults(event, config);
                    initListener();
                });
                $scope.$on('sf-facet-constraints', updateResults);

                vm.facets = facets;
                vm.handler = new FacetHandler(getFacetOptions());
            });

            vm.photos = [];
        }

        function showHelp() {
            $uibModal.open({
                component: 'helpModal',
                size: 'lg',
                resolve: {
                    title: $translate('PHOTO_DEMO.HELP_TEXT_TITLE'),
                    content: $translate('PHOTO_DEMO.HELP_TEXT'),
                    options: function() { return { showEventLegend: false }; }
                }
            });
        }

        function openModal(photo) {
            $uibModal.open({
                component: 'photoModal',
                size: 'lg',
                resolve: {
                    photo: function() { return photo; }
                }
            });
        }

        function getFacetOptions() {
            var options = photoFacetService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            options.scope = $scope;
            return options;
        }

        function disableFacets() {
            return vm.isLoadingResults;
        }

        var latestPageUpdate;
        function nextPage() {
            var updateId = _.uniqueId();
            latestPageUpdate = updateId;

            vm.isLoadingResults = true;
            if (nextPageNo++ <= maxPage) {
                vm.pager.getPage(nextPageNo-1)
                .then(function(page) {
                    if (updateId !== latestPageUpdate) {
                        return;
                    }
                    vm.photos = vm.photos.concat(page);
                    vm.isLoadingResults = false;
                }).catch(handleError);
            } else {
                vm.isLoadingResults = false;
            }
        }

        function isScrollDisabled() {
            return vm.isLoadingResults || nextPageNo > maxPage;
        }

        var latestUpdate;
        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint, vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            vm.error = undefined;
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            vm.isLoadingResults = true;
            vm.photos = [];
            nextPageNo = 0;

            photoFacetService.getResults(facetSelections)
            .then(function(pager) {
                return pager.getMaxPageNo().then(function(no) {
                    return [pager, no];
                });
            }).then(function(res) {
                if (latestUpdate !== updateId) {
                    return;
                }
                vm.pager = res[0];
                maxPage = res[1];
                vm.isLoadingResults = false;
                return nextPage();
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = photoFacetService.getErrorMessage(error);
        }
    }
})();
