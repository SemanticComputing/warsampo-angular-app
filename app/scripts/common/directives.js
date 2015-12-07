'use strict';

angular.module('eventsApp')
.directive('fallbackImg', function() {
    return {
        restrict:'A',
        link: function(scope, element) {
            element.error(function() {
                var src;
                if (element.data('thumbnail')) {
                    src = '/images/no-image-sm.png';
                } else {
                    src = '/images/no-image.png';
                }
                if (!_.contains(element.attr('src'), src)) {
                    element.attr('src', src);
                } else {
                    element.attr('src', '');
                }
            });
        }
    };
})
.directive('fallbackImgForGallery', function() {
    return {
        restrict:'A',
        link: function(scope, element) {
            element.error(function() {
                var src = '/images/no-image-sm.png';
                if (!_.contains(element.attr('src'), src)) {
                    element.attr('src', src);
                    var a = element.parent();
                    a.attr('href', '/images/no-image.png');
                    a.attr('target', '_self');
                } else {
                    element.attr('src', '');
                }
            });
        }
    };
})
.directive('relatedLinks', function() {
    return {
        restrict:'E',
        scope: {
            title: "=",
            related: "=",
            pager: "=paginator"
        },
        link: function(scope, element, attrs) {
            if ('external' in attrs) {
                scope.external = true;
            }
        },
        controllerAs: 'relatedCtrl',
        controller: function($scope) {
            var self = this;
            
            self.isLoadingPage = false;
            self.pageSize = 10;

            if ($scope.pager) {
                $scope.pager.totalItems.then(function(count) {
                    self.totalItems = count;
                });
            }

            self.updatePage = function() {
                self.isLoadingPage = true;
                var latestPage = self.currentPage;

                $scope.pager.getPage(self.currentPage).then(function(page) {
                    if (latestPage === self.currentPage) {
                        self.isLoadingPage = false;
                        $scope.related = page;
                    }
                });
            };
        },
        templateUrl: "views/partials/link_collapse_partial.html"
    };
})
.directive('photoScroller', function() {
    return {
        restrict:'E',
        scope: {
            images: "="
        },
        templateUrl: "views/partials/photo_scroller_partial.html"
    };
})
.directive('pageLink', function() {
    var link = function(scope, element, attrs) {
        var setSrc = function(value) {
            var path, target, params;
            var objId = value;
            if (_.includes(objId, '/times/')) {
                path = 'times/page';
            } else if (_.includes(objId, '/events/')) {
                path = 'events/page';
            } else if (_.includes(objId, '/photographs/')) {
                path = 'photographs/page';
            } else if (_.includes(objId, '/person_')) {
                path = 'persons/page';
            } else if (_.includes(objId, '/actor_')) {
                path = 'units/page';
            } else if (_.includes(objId, '/ranks/')) {
                path = 'ranks/page';
            } else if (_.includes(objId, '/narc-menehtyneet')) {
                path = 'casualties/page';
            } else if (_.includes(objId, '/places/')) {
                path = 'places/page';
                target = '_self';
                params = '&oldMap=true';
            } else {
                path = "page";
                target = "_self";
            }

            var url = path + '?uri=' + objId + (params ? params : '');
            element.attr('href', url);
            if (target) {
                element.attr('target', target);
            }
        };

        scope.$watch(attrs.pageLink, function(value) {
            setSrc(value);
        });
    };

    return {
        restrict:'A',
        link: link
    };
});
