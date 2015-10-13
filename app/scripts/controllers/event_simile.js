'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # SimileMapCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SimileMapCtrl', function ($routeParams, $location, 
              $anchorScroll, $timeout, $window, $scope, $rootScope,
              eventService, photoService, casualtyService, actorService, timemapService) {

    var self = this;

    // The currently selected event
    self.current = undefined;
    // Images related to currently selected event
    self.images = undefined;
    // Current image page
    self.photoDaysBefore = 1;
    self.photoDaysAfter = 3;
    self.photoPlace = true;
    self.photoDaysBeforeSetting = self.photoDaysBefore;
    self.photoDaysAfterSetting = self.photoDaysAfter;
    self.photoPlaceSetting = self.photoPlace;
    self.showCasualtyHeatmap = true;
    self.showPhotos = false;
    var tm, map, heatmap;

    $rootScope.showHelp = function() {
        self.current = undefined;
    };

    self.settingsVisible = false;
    $rootScope.showSettings = function() {
        self.settingsVisible = !self.settingsVisible;
    };

    self.getEventTitleWithLinks = function(event) {
        var time = eventService.createTitle(event);
        var place;

        if (event.place) {
            var link = "<a href={0}>{1}</a>";
            if (_.isArray(event.place)) {
                place = _(event.place).pluck('label').forEach(function(p) {
                    return link.format(p.id, p.label);
                }).join(", ");
            } else {
                place = link.format(event.place.id, event.place.label);
            }

            return place + ' ' + time; 
        }

        return time;
    };

    function changeDateAndFormat(date, days) {
        var d = new Date(date);
        d.setDate(d.getDate() + days);
        return formatDate(d);
    }

    function formatDate(date) {
        return date.toISOString().slice(0, 10);
    }

    var fetchRelatedPeople = function(item) {
        if (item.participant_id) {
            casualtyService.getCasualtyInfo(item.participant_id).then(function(participants) {
                self.current.related_people = participants;
            });
            fetchActors(item);
        }
    };

    var fetchActors = function(item) {
        var actorTypePrefix = 'http://ldf.fi/warsa/actors/actor_types/';

        actorService.getActorInfo(item.participant_id).then(function(participants) {
            self.current.commanders = [];
            self.current.units = [];
            var setActor = function(actor) {
                if (actor.type === actorTypePrefix + 'MilitaryPerson') {
                    self.current.commanders.push(actor);
                } else if (actor.type === actorTypePrefix + 'MilitaryUnit') {
                    self.current.units.push(actor);
                }
            };
            if (_.isArray(participants)) {
                participants.forEach(function(p) {
                    setActor(p);
                });
            } else if (participants) {
                setActor(participants);
            }
        });
    };

    self.showPhotoGallery = function() {
        blueimp.Gallery($('#photo-thumbs a'), $('#blueimp-gallery').data());
    };

    var fetchImages = function(item) {
        self.isLoadingImages = true;

        self.images = [];
        var place_ids;
        if (self.photoPlace) {
            place_ids = _.pluck(item.opts.event.places, 'id');
            if (!place_ids) {
                self.isLoadingImages = false;
                setTimeout(function(){ $scope.$apply(); });
                return;
            }
        }
        photoService.getPhotosByPlaceAndTimeSpan(place_ids, 
                changeDateAndFormat(item.getStart(), -self.photoDaysBefore), 
                changeDateAndFormat(item.getEnd(), self.photoDaysAfter))
        .then(function(imgs) {
            self.isLoadingImages = false;
            imgs.forEach(function(img) {
                img.thumbnail = img.url.replace("_r500", "_r100");
                self.images.push(img);
            });
        });
    };

    self.photoConfigChanged = function() {
        return (self.photoDaysBefore !== self.photoDaysBeforeSetting) ||
            (self.photoDaysAfter !== self.photoDaysAfterSetting) ||
            (self.photoPlace !== self.photoPlaceSetting);
    };

    self.fetchImages = function() {
        if (self.current) {
            fetchImages(self.current);
        }
    };

    self.updateTimeline = function() {
        self.photoDaysBefore = self.photoDaysBeforeSetting;
        self.photoDaysAfter = self.photoDaysAfterSetting;
        self.photoPlace = self.photoPlaceSetting;
        self.current = undefined;
        self.images = [];

        self.visualize();
    };

    var getCasualtyLocations = function() {
        var band = tm.timeline.getBand(0);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        return casualtyService.getCasualtyLocationsByTime(formatDate(start), formatDate(end))
            .then(function(casualties) {
                var res = [];
                casualties.forEach(function(casualty) {
                    var point = casualty.point.split(' ');
                    res.push(new google.maps.LatLng(parseFloat(point[0]), parseFloat(point[1])));
                });
                return res;
            });
    };

    var getCasualtyCount = function() {
        var band = tm.timeline.getBand(0);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        self.minVisibleDate = start;
        self.maxVisibleDate = end;
        casualtyService.getCasualtyCountsByTimeGroupByType(formatDate(start), formatDate(end))
        .then(function(counts) {
            self.casualtyStats = counts;
            var count = 0;
            counts.forEach(function(type) {
                count += parseInt(type.count);
            });
            self.casualtyCount = count;
         });
    };

    var heatmapListener = function() {
        if (self.showCasualtyHeatmap) {
            getCasualtyLocations().then(function(locations) {
                heatmap.setData(locations);
                heatmap.setMap(map);
            });
        }
    };

    var clearHeatmap = function() {
        if (tm.timeline.getBand(0)._dragging || tm.timeline.getBand(1)._dragging) {
            heatmap.setMap(null);
        }
    };

    self.updateHeatmap = function() {
        if (self.showCasualtyHeatmap) {
            heatmapListener();
        } else {
            heatmap.setMap(null);
        }
    };

    var onMouseUpListener = function() {
        heatmapListener();
        getCasualtyCount();
    };

    var infoWindowCallback = function(item) {
        console.log(item);
        $location.search('uri', item.opts.event.id);
        self.current = item;
        fetchRelatedPeople(item.opts.event);
        fetchImages(item);
    };


    self.createTimeMap = function(start, end, highlights) {

        var photoConfig = {
            beforeOffset: self.photoDaysBefore,
            afterOffset: self.photoDaysAfter,
            inProximity: self.photoPlace
        };

        return timemapService.createTimemap(start, end, highlights, infoWindowCallback, photoConfig)
        .then(function(timemap) {
            $("#photo-thumbs").mThumbnailScroller({ type: "hover-precise", 
                markup: { thumbnailsContainer: "div", thumbnailContainer: "a" } });
            tm = timemap;
            map = timemap.getNativeMap();
            map.setOptions({ zoomControl: true });
            var band = tm.timeline.getBand(0);

            getCasualtyCount();
            timemapService.setOnMouseUpListener(onMouseUpListener);
            band.addOnScrollListener(clearHeatmap);
            getCasualtyLocations().then(function(locations) {
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: locations,
                    radius: 20
                });
                self.updateHeatmap();
            });
        });
    };

    var worldWarHighlight = {
        startDate: "1939-09-01",
        endDate: "1945-09-02",
        color:      "#F2F2F2",
        opacity:    20,
        startLabel: "Toinen maailmansota",
        endLabel:   "",
        cssClass: "band-highlight"
    };

    var winterWarHighlights = [
        {
            startDate: "1939-11-30",
            endDate: "1940-03-13",
            color:      "#94BFFF",
            opacity:    20,
            startLabel: "Talvisota",
            endLabel:   "",
            cssClass: "band-highlight"
        }
    ];

    var continuationWarHighlights = [
        {
            startDate: "1941-06-25",
            endDate: "1944-09-19",
            color:      "#FFC080",
            opacity:    20,
            startLabel: "Jatkosota",
            endLabel:   "",
            cssClass: "band-highlight"
        }
    ];

    var winterWarTimeSpan = {
        start: '1939-07-01',
        end: '1940-04-30'
    };
    var continuationWarTimeSpan = {
        start: '1941-06-01',
        end: '1944-12-31'
    };

    self.showWinterWar = function() {
        return self.createTimeMap('1939-07-01', '1940-04-30', winterWarHighlights);
    };
    self.showContinuationWar = function() {
        return self.createTimeMap('1941-06-01', '1944-12-31', continuationWarHighlights);
    };

    self.visualize = function() {
        var era = $routeParams.era;
        var event_uri = $routeParams.uri;
        if (era || !event_uri) {
            if (era && era.toLowerCase() === 'continuationwar') {
                self.showContinuationWar();
            } else {
                self.showWinterWar();
            }
        } else {
            eventService.getEventById(event_uri).then(function(e) {
                if (e) {
                    var show;
                    if (new Date(e.start_time) >= new Date(winterWarTimeSpan.start) &&
                            new Date(e.end_time) <= new Date(winterWarTimeSpan.end)) {
                        show = self.showWinterWar;
                    } else {
                        show = self.showContinuationWar;
                    }
                            
                    show().then(function() {
                        var item = _.find(tm.getItems(), function(item) {
                            return _.isEqual(item.opts.event, e);
                        });
                        self.current = item;
                        tm.timeline.getBand(0).setCenterVisibleDate(new Date(e.start_time));
                        tm.setSelected(item);
                        item.openInfoWindow();
                    });
                }
            });
        }
    };

    self.visualize();

});
