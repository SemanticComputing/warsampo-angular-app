(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsRelatedLinksPaged', function() {
        return {
            restrict:'E',
            scope: {
                title: '=',
                pager: '=paginator'
            },
            link: function(scope, element, attrs) {
                if ('external' in attrs) {
                    scope.external = true;
                }
            },
            controllerAs: 'relatedCtrl',
            controller: RelatedController,
            templateUrl: 'views/directive/ws-related-links-paged.directive.html'
        };
    });

    /* @ngInject */
    function RelatedController($scope, Settings) {
        var self = this;

        self.isLoadingPage = false;
        self.pageSize = Settings.pageSize;

        self.updatePage = updatePage;

        $scope.$watch('pager', function(val) {
            if (val) {
                $scope.pager.getTotalCount().then(function(count) {
                    self.totalItems = count;
                });
                self.isLoadingPage = true;
                $scope.pager.getPage(0).then(function(page) {
                    self.isLoadingPage = false;
                    self.related = page;
                });
            } else {
                self.totalItems = null;
                self.related = null;
            }
        });

        function updatePage() {
            self.isLoadingPage = true;
            var latestPage = self.currentPage;

            $scope.pager.getPage(self.currentPage - 1).then(function(page) {
                if (latestPage === self.currentPage) {
                    self.isLoadingPage = false;
                    self.related = page;
                }
            });
        }
    }
})();
