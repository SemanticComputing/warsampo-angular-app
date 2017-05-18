(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PhotoPageController', PhotoPageController);

    function PhotoPageController($routeParams, $q, $rootScope, _, photoService, eventService,
            placeRepository, Settings) {

        $rootScope.showSettings = null;
        $rootScope.showHelp = null;
        var vm = this;

        init();

        function init() {
            if (!$routeParams.uri) {
                return;
            }
            vm.isLoadingObj = true;
            vm.isLoadingLinks = true;
            photoService.getById($routeParams.uri)
                .then(function(photo) {
                    vm.photo = photo;
                    vm.isLoadingObj = false;
                    return fetchRelated(vm.photo);
                }).then(function(related) {
                    vm.relatedEventsByPlace = related.eventsByPlace;
                    vm.relatedEventsByTime = related.eventsByTime;
                    vm.isLoadingLinks = false;
                }).catch(function() {
                    vm.isLoadingObj = false;
                    vm.isLoadingLinks = false;
                });
        }

        function fetchRelated(photo) {
            var promises = {
                related: photoService.fetchRelated(photo),
                photos: photoService.fetchRelatedPhotos(photo)
            };
            if (photo.created) {
                promises.eventsByTime = eventService.getEventsLooselyWithinTimeSpanPager(photo.created,
                            photo.created, { pageSize: Settings.pageSize });
            }
            return $q.all(promises)
            .then(function(related) {
                if ((photo.places || []).length) {
                    return placeRepository.getNearbyPlaceIds(_.map(photo.places, 'id'))
                    .then(function(ids) {
                        return eventService.getEventsByPlaceIdPager(ids, { pageSize: Settings.pageSize });
                    })
                    .then(function(events) {
                        related.eventsByPlace = events;
                        return related;
                    });
                }
                return related;
            })
            .then(function(related) {
                var eventCounts = [];
                if (related.eventsByPlace) {
                    eventCounts.push(related.eventsByPlace.getTotalCount());
                }
                if (related.eventsByTime) {
                    eventCounts.push(related.eventsByTime.getTotalCount());
                }
                return $q.all(eventCounts)
                .then(function(counts) {
                    if (_.some(counts, Boolean)) {
                        photo.hasLinks = true;
                    }
                    return related;
                });
            });
        }
    }
})();
