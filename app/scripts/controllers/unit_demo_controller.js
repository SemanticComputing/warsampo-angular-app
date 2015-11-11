'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # SimileMapCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('UnitDemoCtrl', function ($routeParams, $location, 
              $anchorScroll, $timeout, $window, $scope, $rootScope, $route,
              eventService, photoService, casualtyService, unitService,
              Settings, timemapService) {

    var self = this;
    self.unitService=unitService;

    // Images related to currently selected event
    self.images = undefined;
    var tm, map, heatmap;

    $rootScope.showHelp = function() {
        self.current = undefined;
    };

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
			
        unitService.getActorInfo(item.participant_id).then(function(participants) {
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

    var getCasualtyLocations = function() {
        var band = tm.timeline.getBand(1);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        var unit='<'+self.current.id+'>';
        if (self.current.subUnits) {
        		// console.log("self.current.subUnits"+self.current.subUnits);
        		for (var i=0; i<self.current.subUnits.length; i++) { unit = unit + ' <'+self.current.subUnits[i].id+'>'; }
        		// console.log('all units '+unit.length+ ":");
        } 
         return casualtyService.getCasualtyLocationsByTimeAndUnit(start.toISODateString(), end.toISODateString(), unit)
            .then(function(casualties) {
            	//console.log('casualties');
                var res = [];
                casualties.forEach(function(casualty) {
                    res.push(new google.maps.LatLng(parseFloat(casualty.lat), parseFloat(casualty.lon)));
                });
                return res;
            });
    };

    var getCasualtyCount = function() {
        var band = tm.timeline.getBand(1);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        self.minVisibleDate = start;
        self.maxVisibleDate = end;
        casualtyService.getCasualtyCountsByTimeGroupByType(start.toISODateString(), end.toISODateString())
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
        if (Settings.showCasualtyHeatmap) {
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
        if (Settings.showCasualtyHeatmap) {
            heatmapListener();
        } else {
            heatmap.setMap(null);
        }
    };

    var onMouseUpListener = function() {
        heatmapListener();
        getCasualtyCount();
    };

    var fetchImages = function(item) {
        self.isLoadingImages = true;
        var photoConfig = Settings.getPhotoConfig();
        self.images = [];
        photoService.getRelatedPhotosForEvent(item.opts.event, photoConfig).then(function(imgs) {
            self.images = imgs;
            self.isLoadingImages = false;
        });
    };
    
    var infoWindowCallback = function(item) {
        self.current = item;
        fetchRelatedPeople(item.opts.event);
        fetchImages(item);
    };


    self.createTimeMap = function(id, start, end, highlights) {
			console.log('createTimeMap '+id);
			
        var photoConfig = Settings.getPhotoConfig();
			
        return timemapService.createTimemapByActor(id, start, end, highlights, infoWindowCallback, photoConfig)
        .then(function(timemap) {
            tm = timemap;
            map = timemap.getNativeMap();
            map.setOptions({ zoomControl: true });

            //	control not to ever zoom too close up:
            var zminlistener = google.maps.event.addListener(map, "idle", function() { 
                if (map.getZoom() > 8) map.setZoom(8); 
                if (map.getZoom() < 2) {
                    map.setZoom(5);
                    map.setCenter({lat: 62.0, lng: 25.0 });
                }
                google.maps.event.removeListener(zminlistener); 
            });

            var band = tm.timeline.getBand(1);

            getCasualtyCount();
            timemapService.setOnMouseUpListener(onMouseUpListener);
            band.addOnScrollListener(clearHeatmap);
            tm.timeline.setAutoWidth();
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

    var winterWarTimeSpan = {
        start: '1939-07-01',
        end: '1940-04-30'
    };

    self.showWinterWar = function(id) {
        console.log('showWinterWar');
        return self.createTimeMap(id, winterWarTimeSpan.start, winterWarTimeSpan.end, winterWarHighlights);
    };

    self.createTimeMapForActor = function(id) {
        //console.log('showWinterWar');
        self.currentUnitId = id;
        return self.showWinterWar(id);
    };

    self.showUnit = function() {
        var uri = getSelectionUri('unitSelector');
        //console.log('showUnit '+uri+' ,'+this.current.id);
        if (!uri) { return initSelector('unitSelector'); /* uri = ':actor_940'; */ }
        self.noReload = true;
        $location.search('uri', uri);
        if (uri) {
            return self.showWinterWar(uri);//.then(initSelector('unitSelector'));
        }
    };

    self.showPerson = function() {
        var uri = getSelectionUri('unitSelector');
        if (!uri) { return initSelector('unitSelector'); /* uri = ':actor_940'; */ }
        self.noReload = true;
        $location.search('uri', uri);
        if (uri) {
            return self.showWinterWar(uri);//.then(initSelector('unitSelector'));
        }
    };

    this.updateByUri = function(uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = false;
        unitService.getById(uri).then(function(unit) {
            if (_.isArray(unit.name)) {
                var arr=unit.name;
                unit.name=arr.shift();
                unit.altNames=arr;
            }
            self.current = unit; 
            self.isLoadingEvent = false;
            self.current.fetchRelated2();
            return self.createTimeMapForActor(uri);
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    };

    self.items= []; 
    self.queryregex="";


    this.getItems= function () {
        unitService.getItems(this.queryregex,this).then(function(data) {
            self.items = data;
        });
    };

    this.getItems();

    this.updateUnit = function () {
        if (this.current && this.current.id) {
            var uri=this.current.id;
            this.label = this.current.name;
            if ($location.search().uri != uri) {
                self.noReload = true;
                $location.search('uri', uri);
            }
            this.updateByUri(uri);
        }
    };

    // Set listener to prevent reload when it is not desired.
    $scope.$on('$routeUpdate', function() {
        if (!self.noReload) {
            $route.reload();
        } else {
            self.noReload = false;
        }
    });


    if ($routeParams.uri) { 
        self.updateByUri($routeParams.uri); 
    } else { 
        self.current = { name: "Jalkaväkirykmentti 37", id: "http://ldf.fi/warsa/actors/actor_940" };
        self.updateUnit();
    }

});
