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
      this.imagePager = $scope.images;
      this.imagePager.getPage(0).then(function(page) {
          $scope.images = page;
      });

    $("#photo-thumbs").mThumbnailScroller({ type: "hover-30",
        markup: { thumbnailsContainer: "div", thumbnailContainer: "a" } });
});
