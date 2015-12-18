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

    self.toggleCollapse = function() {
        self.isCollapsed = !self.isCollapsed;
    };

    $scope.$watch('images', function(val) {
        self.isCollapsed = true;
        self.imagePager = val;
        self.imagePager.getAllSequentially(100).then(function(page) {
            self.photos = page;
        }, null, function(partial) {
            self.photos = partial;
        });
    });

//    $("#photo-thumbs").mThumbnailScroller({ type: "hover-30",
//        markup: { thumbnailsContainer: "div", thumbnailContainer: "a" } });
});
