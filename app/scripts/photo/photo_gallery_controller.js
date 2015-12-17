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
    self.collapseLevel = 0;

    self.showMore = function() {
        if (self.collapseLevel < 2) {
            self.collapseLevel++;
        }
    }

    self.showLess = function() {
        self.collapseLevel = 0;
    };

    self.showAll = function() {
        self.collapseLevel = 2;
    };

    $scope.$watch('images', function(val) {
        self.collapseLevel = 0;
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
