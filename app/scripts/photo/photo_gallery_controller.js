'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PhotoGalleryCtrl
 * @description
 * # PhotoGalleryCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('PhotoGalleryCtrl', function($scope, $q, $timeout, $log, $window) {
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

    $scope.$watch('images', function(val) {
        self.imageCount = 0;
        self.photos = [];
        self.hasMore = false;
        self.isCollapsed = true;
        self.imagePager = val;
        if (!val) {
            return;
        }
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
        var fullHeight = $('#photo-thumbs')[0].scrollHeight;
        var visibleHeight = $('#photo-thumbs')[0].clientHeight;
        self.hasMore = fullHeight > visibleHeight ? true : false;
        $scope.$apply();
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

});
