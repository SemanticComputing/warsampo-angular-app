'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PhotoGalleryCtrl
 * @description
 * # PhotoGalleryCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('PhotoGalleryCtrl', function() {

    $("#photo-thumbs").mThumbnailScroller({ type: "hover-30", 
        markup: { thumbnailsContainer: "div", thumbnailContainer: "a" } });
});
