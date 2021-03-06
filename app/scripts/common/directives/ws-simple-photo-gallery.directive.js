(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsSimplePhotoGallery', function() {
        return {
            restrict:'E',
            scope: {
                images: '<',
                config: '<',
                club: '<'
            },
            controller: SimplePhotoGalleryContoller,
            controllerAs: 'ctrl',
            templateUrl: 'views/directive/ws-simple-photo-gallery.directive.html'
        };
    });

    /* @ngInject */
    function SimplePhotoGalleryContoller($scope, $q, _) {
        var self = this;

        self.isCollapsed = true;
        self.imageCount;
        self.isLoadingImages;
        self.photos = [];
        self.galleryId = _.uniqueId();
        self.cameraClub;


        $scope.$watch('images', function(val) {
            if (!val || _.isArray(val) && !val.length) {
                return;
            }

            self.nPhotosText = _.get($scope, 'config.nPhotosText') || 'N_PHOTOS';
            self.cameraClub = _.get($scope, 'club');

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
            self.isCollapsed = true;
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
