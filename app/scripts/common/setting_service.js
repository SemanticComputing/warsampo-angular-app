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

    self.updater = function() { };

    self.apply = function() {
        self.updater();
    };

    self.setHeatmapUpdater = function(fun) {
        self.heatmapUpdater = fun;
    };

    self.setApplyFunction = function(fun) {
        self.updater = fun;
    };

    self.getPhotoConfig = function() {
        var photoConfig = {
            beforeOffset: self.photoDaysBefore,
            afterOffset: self.photoDaysAfter,
            inProximity: self.photoPlace
        };
        return photoConfig;
    };

    // Paging settings

    self.softPageSize = 10;
    self.hardPageSize = 10;
});
