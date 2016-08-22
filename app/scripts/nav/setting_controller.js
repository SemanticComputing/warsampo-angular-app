(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsSettings', wsSettingsDirective);

    function wsSettingsDirective(Settings) {
        return {
            templateUrl: 'views/directive/ws-settings.directive.html',
            controller: SettingsController,
            controllerAs: 'ctrl',
            scope: {}
        };

        function SettingsController() {
            var self = this;

            self.photoDaysBeforeSetting = Settings.photoDaysBefore;
            self.photoDaysAfterSetting = Settings.photoDaysAfter;
            self.photoPlaceSetting = Settings.photoPlace;
            self.showCasualtyHeatmap = Settings.showCasualtyHeatmap;

            self.getSettingsVisibility = Settings.getSettingsVisibility;

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

                Settings.apply();
            };

            self.updateHeatmap = function() {
                Settings.showCasualtyHeatmap = self.showCasualtyHeatmap;
                Settings.updateHeatmap();
            };
        }
    }
})();
