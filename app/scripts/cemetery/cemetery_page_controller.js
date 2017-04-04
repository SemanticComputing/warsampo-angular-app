(function() {
    'use strict';

    /**
    * @ngdoc controller
    * @name eventsApp.controller:CemeteryPageController
    * @description
    * # CemeteryPageController
    * Cemetery page controller.
    */
    angular.module('eventsApp')
    .controller('CemeteryPageController', CemeteryPageController);


        /* @ngInject */
        function CemeteryPageController($routeParams, $q, $rootScope, cemeteryService) {
            var self = this;

            if ($routeParams.uri) {

                self.isLoadingLinks = true;
                cemeteryService.getSingleCemeteryById($routeParams.uri)
                .then(function(cemetery) {
                    self.cemetery = cemetery;
                    self.isLoadingLinks = false;
                    return cemeteryService.fetchRelated(cemetery);
                }).catch(function() {
                    self.isLoadingEvent = false;
                    self.isLoadingLinks = false;
                });
            }
        }


    // /* @ngInject */
    // function CemeteryPageController($routeParams, $q, _, cemeteryService, Settings) {
    //
    //     var vm = this;
    //
    //     init();
    //
    //     function init() {
    //         if (!$routeParams.uri) {
    //             return;
    //         }
    //         vm.isLoadingCemetery = true;
    //         vm.isLoadingLinks = true;
    //         cemeteryService.getSingleCemeteryById($routeParams.uri)
    //         .then(function(cemetery) {
    //             vm.cemetery = cemetery;
    //             //console.log(vm.cemetery);
    //             return cemeteryService.fetchRelated(vm.cemetery);
    //         }).then(function() {
    //             vm.isLoadingCemetery = false;
    //             return cemeteryService.getCemeteriesByPlaceId(vm.cemetery.place_id,
    //                 Settings.pageSize, vm.cemetery.id);
    //         })
    //         .then(function(cemeteries) {
    //             return cemeteries.getTotalCount()
    //             .then(function(count) {
    //                 if (count) {
    //                     vm.cemetery.hasLinks = true;
    //                 }
    //                 vm.relatedCemeteriesByPlace = cemeteries;
    //                 vm.isLoadingLinks = false;
    //             });
    //         }).catch(function() {
    //             vm.isLoadingCemetery = false;
    //             vm.isLoadingLinks = false;
    //         });
    //     }
    // }
})();
