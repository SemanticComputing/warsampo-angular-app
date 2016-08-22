(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .service('Settings', function() {
        var self = this;

        setDefaults();

        /* Public API */

        // Function: reset all values to their defaults
        self.setDefaults = setDefaults;
        // Function: reset event-related settings to their defaults
        self.clearEventSettings = setEventDefaults;
        // Function: set the function that displays perspective-specific help
        self.setHelpFunction = setHelpFunction;
        // Function: enable settings (i.e. show the settings button in the navbar)
        self.enableSettings = enableSettings;
        // Function: disable settings (i.e. hide the settings button in the navbar)
        self.disableSettings = disableSettings;
        // Function(fun): set the function that updates the heatmap
        self.setHeatmapUpdater = setHeatmapUpdater;
        // Function: update the heatmap (i.e. call the heatmap update function)
        self.updateHeatmap = updateHeatmap;
        // Function: clear navbar-related values
        self.clearNav = clearNav;
        // Function: get configuration for event photo linking
        self.getPhotoConfig = getPhotoConfig;
        // Function: return true if the help button should be visible
        self.getHelpButtonVisibility = getHelpButtonVisibility;
        // Function: return true if the settings button should be visible
        self.getSettingsButtonVisibility = getSettingsButtonVisibility;
        // Function: return true if settings should be visible
        self.getSettingsVisibility = getSettingsVisibility;
        // Function: toggle settings visible/hidden
        self.toggleSettings = toggleSettings;
        // Function(fun): set the function for applying settings
        self.setApplyFunction = setApplyFunction;
        // Function: call the settings apply function
        self.apply = apply;

        /* Implementation */

        function setDefaults() {
            setEventDefaults();

            // Paging settings

            self.pageSize = 10;
            self.pagesFetchedPerQuery = 10;
        }

        function setEventDefaults() {
            self.photoDaysBefore = 1;
            self.photoDaysAfter = 3;
            self.photoPlace = true;
            self.showCasualtyHeatmap = true;
            self.showPhotos = false;
            self.showCasualtyHeatmap = true;
            self.showHelpButton = false;
            self.showSettingsButton = false;
            self.settingsVisible = false;

            self.updater = function() { };
            self.heatmapUpdater = function() { };
            self.getHelp = null;
        }

        function setHelpFunction(fn) {
            self.showHelpButton = true;
            self.getHelp = fn;
        }

        function clearNav() {
            self.showSettingsButton = false;
            self.showHelpButton = false;
            self.getHelp = undefined;
        }

        function getHelpButtonVisibility() {
            return self.showHelpButton;
        }

        function getSettingsButtonVisibility() {
            return self.showSettingsButton;
        }

        function enableSettings() {
            self.showSettingsButton = true;
        }

        function disableSettings() {
            self.showSettingsButton = false;
        }

        function getSettingsVisibility() {
            return self.settingsVisible;
        }

        function toggleSettings() {
            self.settingsVisible = !self.settingsVisible;
        }

        function updateHeatmap() {
            self.heatmapUpdater();
        }

        function setHeatmapUpdater(fun) {
            self.heatmapUpdater = fun;
        }

        function apply() {
            self.updater();
        }

        function setApplyFunction(fun) {
            self.updater = fun;
        }

        function getPhotoConfig() {
            var photoConfig = {
                beforeOffset: self.photoDaysBefore,
                afterOffset: self.photoDaysAfter,
                inProximity: self.photoPlace
            };
            return photoConfig;
        }

    });
})();
