(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PersonPhotoController', PersonPhotoController);

    /* @ngInject */
    function PersonPhotoController($log, photoService, uri) {

        var self = this;

        self.config = {
            showAll: true
        };

        init();

        function init() {
            if (uri) {
                self.isLoading = true;
                photoService.getByPersonId(uri, { pageSize: null })
                .then(function(photos) {
                    self.photos = photos;
                    self.isLoading = false;
                }).catch(function(err) {
                    $log.error(err);
                    self.isLoading = false;
                });
            }
        }
    }
})();
