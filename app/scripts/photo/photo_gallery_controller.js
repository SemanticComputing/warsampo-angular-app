'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PhotoGalleryCtrl
 * @description
 * # PhotoGalleryCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('PhotoGalleryCtrl', function($scope) {
    var self = this;

    self.isCollapsed = true;
    self.imageCount;
    self.isLoadingImages;

    self.toggleCollapse = function() {
        if (self.imageCount !== self.photos.length) {
            self.getAllPhotos().then(function() {
                self.isCollapsed = !self.isCollapsed;
            });
        } else {
            self.isCollapsed = !self.isCollapsed;
        }
    };

    self.getAllPhotos = function() {
        self.isLoadingImages = true;
        return self.imagePager.getAllSequentially(100).then(function(page) {
            self.isLoadingImages = false;
            self.photos = page;
        }, null, function(partial) {
            self.photos = partial;
        });
    };

    $scope.$watch('images', function(val) {
        self.isCollapsed = true;
        self.imagePager = val;
        self.imagePager.getTotalCount().then(function(count) {
            self.imageCount = count;
        });
        self.isLoadingImages = true;
        self.imagePager.getPage(0).then(function(page) {
            self.isLoadingImages = false;
            self.photos = page;
        });
    });

//    $("#photo-thumbs").mThumbnailScroller({ type: "hover-30",
//        markup: { thumbnailsContainer: "div", thumbnailContainer: "a" } });
});
