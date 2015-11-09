'use strict';

angular.module('eventsApp')
    .service('Settings', function() {
    var self = this;

    self.photoDaysBefore = 1;
    self.photoDaysAfter = 3;
    self.photoPlace = true;
    self.showCasualtyHeatmap = true;
    self.showPhotos = false;
    self.showCasualtyHeatmap = true;

    self.heatmapUpdater = function() { };

    self.updateHeatmap = function() {
        self.heatmapUpdater();
    };

    self.setHeatmapUpdater = function(fun) {
        self.heatmapUpdater = fun;
    };

    self.getPhotoConfig = function() {
        var photoConfig = {
            beforeOffset: self.photoDaysBefore,
            afterOffset: self.photoDaysAfter,
            inProximity: self.photoPlace
        };
        return photoConfig;
    };
});
