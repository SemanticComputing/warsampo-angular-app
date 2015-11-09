'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:PageCtrl
 * @description
 * # PageCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
.controller('SettingCtrl', function($rootScope, Settings) {
    var self = this;

    self.settingsVisible = false;

    $rootScope.showSettings = function() {
        self.settingsVisible = !self.settingsVisible;
    };

    self.photoDaysBeforeSetting = Settings.photoDaysBefore;
    self.photoDaysAfterSetting = Settings.photoDaysAfter;
    self.photoPlaceSetting = Settings.photoPlace;
    self.showCasualtyHeatmap = Settings.showCasualtyHeatmap;

    self.photoConfigChanged = function() {
        return (Settings.photoDaysBefore !== self.photoDaysBeforeSetting) ||
            (Settings.photoDaysAfter !== self.photoDaysAfterSetting) ||
            (Settings.photoPlace !== self.photoPlaceSetting);
    };

    self.update = function() {
        Settings.photoDaysBefore = self.photoDaysBeforeSetting;
        Settings.photoDaysAfter = self.photoDaysAfterSetting;
        Settings.photoPlace = self.photoPlaceSetting;
        Settings.showCasualtyHeatmap = self.showCasualtyHeatmap;
    };

    self.updateHeatmap = function() {
        Settings.showCasualtyHeatmap = self.showCasualtyHeatmap;
        Settings.updateHeatmap();
    };

});
