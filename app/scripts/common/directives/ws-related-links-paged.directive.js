(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsRelatedLinksPaged', function() {
        return {
            restrict:'E',
            scope: {
                title: '<',
                additionalText: '<',
                pager: '<paginator'
            },
            link: function(scope, element, attrs) {
                if ('external' in attrs) {
                    scope.external = true;
                }
            },
            controllerAs: 'vm',
            controller: RelatedController,
            templateUrl: 'views/directive/ws-related-links-paged.directive.html'
        };
    });

    /* @ngInject */
    function RelatedController($scope, Settings) {
        var vm = this;

        vm.isLoadingPage = false;
        vm.pageSize = Settings.pageSize;

        vm.updatePage = updatePage;
        vm.getLabel = getLabel;

        $scope.$watch('pager', function(val) {
            if (val) {
                $scope.pager.getTotalCount().then(function(count) {
                    vm.totalItems = count;
                });
                vm.isLoadingPage = true;
                $scope.pager.getPage(0).then(function(page) {
                    vm.isLoadingPage = false;
                    vm.related = page;
                });
            } else {
                vm.totalItems = null;
                vm.related = null;
            }
        });

        function getLabel(thing) {
            return thing.listLabel || thing.verboseLabel || thing.getLabel() || thing.label;
        }

        function updatePage() {
            vm.isLoadingPage = true;
            var latestPage = vm.currentPage;

            $scope.pager.getPage(vm.currentPage - 1).then(function(page) {
                if (latestPage === vm.currentPage) {
                    vm.isLoadingPage = false;
                    vm.related = page;
                }
            });
        }
    }
})();
