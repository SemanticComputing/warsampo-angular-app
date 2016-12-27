(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsPhotoGallery', function() {
        return {
            restrict:'E',
            scope: {
                images: '<'
            },
            controller: PhotoGalleryContoller,
            controllerAs: 'ctrl',
            templateUrl: 'views/directive/ws-photo-gallery.directive.html'
        };
    });

    /* @ngInject */
    function PhotoGalleryContoller($scope, $q, $timeout, $window, _, $translate) {
        var self = this;

        self.isCollapsed = true;
        self.imageCount;
        self.isLoadingImages;
        self.photos = [];

        self.toggleCollapse = toggleCollapse;

        var win = angular.element($window);

        win.bind('resize', checkOverflow);

        $scope.$on('$destroy', function() {
            win.unbind('resize', checkOverflow);
        });

        angular.element('#blueimp-gallery').on('slide', function (event, index) {
            var elem = angular.element('#photo-container a').eq(index);
            var url = '/' + $translate.use() + '/photographs/page?uri=' + encodeURIComponent(elem.data('id'));
            angular.element(this).children('.description').attr('href', url);
        });

        $scope.$watch('images', function(val) {
            if (!val || _.isArray(val)) {
                return;
            }
            self.imageCount = 0;
            self.photos = [];
            self.hasMore = false;
            self.isCollapsed = true;
            self.imagePager = val;
            self.isLoadingImages = true;
            self.imagePager.getTotalCount().then(function(count) {
                self.imageCount = count;
                if (!count) {
                    // No images to fetch, stop here.
                    return $q.reject();
                }
            })
            .then(function() { return self.imagePager.getPage(0); })
            .then(function(page) {
                self.photos = page;
                $timeout(function() {
                    checkOverflow();
                }, 0);
                self.isLoadingImages = false;
            }).catch(function() {
                self.isLoadingImages = false;
            });
        });

        function toggleCollapse() {
            if (self.imageCount !== self.photos.length) {
                getAllPhotos().then(function() {
                    self.isCollapsed = !self.isCollapsed;
                });
            } else {
                self.isCollapsed = !self.isCollapsed;
            }
        }

        function checkOverflow() {
            if (self.photos == false) {
                self.isLoadingImages = false;
                return;
            }
            var elem = angular.element('#photo-thumbs');
            if (elem && elem[0]) {
                var fullHeight = elem[0].scrollHeight;
                var visibleHeight = elem[0].clientHeight;
                self.hasMore = fullHeight > visibleHeight ? true : false;
                $scope.$apply();
            }
        }

        function getAllPhotos() {
            self.isLoadingImages = true;
            return self.imagePager.getAllSequentially(100).then(function(page) {
                self.isLoadingImages = false;
                self.photos = page;
            }, function() {
                self.isLoadingImages = false;
            }, function(partial) {
                self.photos = partial;
            });
        }
    }
})();
