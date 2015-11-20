'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PhotoCtrl
 * @description
 * # PhotoCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('PhotoCtrl', function() {
    var self = this;

    self.showPhotoGallery = function() {
        blueimp.Gallery($('#photo-thumbs a'), $('#blueimp-gallery').data());
    };

    $("#photo-thumbs").mThumbnailScroller({ type: "hover-precise", 
        markup: { thumbnailsContainer: "div", thumbnailContainer: "a" } });
});
