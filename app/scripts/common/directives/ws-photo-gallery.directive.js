(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsPhotoGallery', function() {
        return {
            restrict:'E',
            scope: {
                images: '<',
                config: '<'
            },
            controller: PhotoGalleryController,
            controllerAs: 'ctrl',
            templateUrl: 'views/directive/ws-photo-gallery.directive.html'
        };
    });

    /* @ngInject */
    function PhotoGalleryController($scope, $q, $timeout, $window, _, $translate, baseService) {
        var self = this;

        self.isCollapsed = true;
        self.imageCount = 0;
        self.isLoadingImages;
        self.photos = [];
        self.galleryId = _.uniqueId();

        var win = angular.element($window);

        win.bind('resize', checkOverflow);

        $scope.$on('$destroy', function() {
            win.unbind('resize', checkOverflow);
        });

        $scope.$watch('images', function(val) {
            if (!val || _.isArray(val) && !val.length) {
                return;
            }

            self.nPhotosText = _.get($scope, 'config.nPhotosText') || 'N_PHOTOS';

            if (_.isArray(val)) {
                return handleArray(val);
            }
            return handlePager(val);
        });

        function handlePager(images) {
            self.toggleCollapse = toggleCollapse;

            self.imageCount = 0;
            self.photos = [];
            self.hasMore = false;
            self.isCollapsed = true;
            self.imagePager = images;
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
                setSlideListener();
                self.isLoadingImages = false;
            }).catch(function() {
                self.isLoadingImages = false;
            });
        }

        function handleArray(images) {
            self.toggleCollapse = toggleCollapseSimple;

            self.imageCount = images.length;
            self.photos = images;
            self.hasMore = false;
            self.isCollapsed = _.get($scope, 'config.showAll') ? false : true;
            $timeout(function() {
                checkOverflow();
            }, 0);
            setSlideListener();
        }

        function toggleCollapseSimple() {
            self.isCollapsed = !self.isCollapsed;
        }

        function toggleCollapse() {
            if (self.imageCount !== self.photos.length) {
                getAllPhotos().then(function() {
                    self.isCollapsed = !self.isCollapsed;
                });
            } else {
                self.isCollapsed = !self.isCollapsed;
            }
        }

        function setSlideListener() {
            angular.element('#blueimp-gallery-' + self.galleryId).on('slide', function (event, index) {
                var elem = angular.element('#photo-container-' + self.galleryId + ' a').eq(index);
                var url = '/' + $translate.use() + '/photographs/page/' + baseService.getIdFromUri(elem.data('id'));
                angular.element(this).children('.description').attr('href', url);
            });
        }

        function checkOverflow() {
            if (self.photos == false) {
                self.isLoadingImages = false;
                return;
            }
            var elem = angular.element('#photo-thumbs-' + self.galleryId);
            if (elem && elem[0]) {
                var fullHeight = elem[0].scrollHeight;
                var visibleHeight = elem[0].clientHeight;
                self.hasMore = fullHeight > visibleHeight ? true : false;
                $scope.$apply();
            }
        }

        function getAllPhotos() {
            self.isLoadingMoreImages = true;
            return self.imagePager.getAllSequentially(100).then(function(page) {
                self.isLoadingMoreImages = false;
                self.photos = page;
            }, function() {
                self.isLoadingMoreImages = false;
            }, function(partial) {
                self.photos = partial;
            });
        }
    }
})();
