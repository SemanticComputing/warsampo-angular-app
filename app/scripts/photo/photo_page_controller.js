(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('PhotoPageController', PhotoPageController);

    function PhotoPageController($q, $rootScope, $translate, _, photoService,
            eventService, placeRepository, Settings, uri) {

        $rootScope.showSettings = null;
        $rootScope.showHelp = null;
        var vm = this;

        vm.getDemoLink = getDemoLink;

        init();

        function init() {
            if (uri) {
                return;
            }
            vm.isLoadingObj = true;
            vm.isLoadingLinks = true;
            photoService.getById(uri)
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

        function getDemoLink() {
            var url = ($translate.use() + '/photographs?facets=%7B%22description%22:%7B%22value%22:%22<VALUE>%22,' +
                '%22constraint%22:%22GRAPH%20%3Chttp:%2F%2Fldf.fi%2Fwarsa%2Fphotographs%3E%20%7B%20' +
                '(%3Fid%20%3Fscore)%20%3Chttp:%2F%2Fjena.apache.org%2Ftext%23query%3E%20(%5C%22<VALUE>%5C%22%20100000)%20.%20%7D%22%7D%7D')
                .replace(/<VALUE>/g, vm.photo.description);
            return url;
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
