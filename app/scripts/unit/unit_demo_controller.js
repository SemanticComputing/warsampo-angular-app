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
              $anchorScroll, $timeout, $window, $scope, $rootScope, $route, _,
              eventService, photoService, casualtyRepository, unitService,
              Settings, timemapService) {

    var self = this;
    self.unitService=unitService;

    // Images related to currently selected event
    self.images = undefined;
    var tm, map, heatmap;

    $rootScope.showHelp = function() {
        self.current = undefined;
    };


    // Petri's testings:
    self.testUnitPath=false;

    var getCasualtyLocations = function() {
        var band = tm.timeline.getBand(1);
        var start = band.getMinVisibleDate();
        if (self.testUnitPath) start = new Date(winterWarHighlights[0].startDate);
        var end = band.getMaxVisibleDate();
        var unit='<'+self.current.id+'>';

        return casualtyRepository.getCasualtyLocationsByTimeAndUnit(start.toISODateString(), end.toISODateString(), unit)
            .then(function(casualties) {
                var res = [];
                casualties.forEach(function(casualty) {
                    if ('lat' in casualty) res.push(new google.maps.LatLng(parseFloat(casualty.lat), parseFloat(casualty.lon)));
                });
                if (self.testUnitPath) { averagePath(casualties); }
                return res;
            });
    };


    var averagePath = function (casualties) {

        var obj={};
        // casualties.sort(function(a, b){return a.death_date>b.death_date ? 1 : -1;});

        var coords = [], T=[], X=[], Y=[];
        for (var i=0; i<casualties.length; i++) {
            var c=casualties[i];
            if ('lat' in c && 'date' in c) {

                var x=parseFloat(c.lat),
                    y=parseFloat(c.lon),
                    point= new google.maps.LatLng(x, y);
                coords.push(point);
                X.push(x); Y.push(y);
                T.push(new Date(c.date).getTime());
            }
        }

        // console.log(casualties,T,X,Y);
        if (T.length) {
            var pf= new Polyfitter(T,2,false),
                px=pf.solve(X), py=pf.solve(Y);

            var tt=pf.linspace(T[0],T[T.length-1],10),
                nx=pf.polyval(px,tt),
                ny=pf.polyval(py,tt);

            var coords=[];
            for (var i=0; i<nx.length; i++) {
                coords.push(new google.maps.LatLng(nx[i], ny[i]));
            }
            drawUnitPath(coords);
        }
    }


    self.unitPath = false;
    var drawUnitPath = function (coords) {
        if (self.unitPath) { self.unitPath.setMap(null); }
        if (coords.length) {
            self.unitPath = new google.maps.Polyline({
                path: coords,
                geodesic: true,
                strokeColor: '#0000FF',
                strokeOpacity: 0.35,
                strokeWeight: 5
            });
            self.unitPath.setMap(map);
        }
    };

    var getCasualtyCount = function() {
        var band = tm.timeline.getBand(1);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        var unit='<'+self.current.id+'>';

        self.minVisibleDate = start;
        self.maxVisibleDate = end;
        casualtyRepository.getCasualtyCountsByTimeGroupAndUnitByType(start.toISODateString(), end.toISODateString(), unit)
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
        var photoConfig = Settings.getPhotoConfig();
        if (item.opts.event) {
            photoService.getRelatedPhotosForEvent(item.opts.event, photoConfig).then(function(imgs) {
                self.images = imgs;
            });
        }
    };

    var infoWindowCallback = function(item) {
        self.current = item;
        eventService.fetchRelated(item.opts.event);
        fetchImages(item);
    };


    self.createTimeMap = function(id, start, end, highlights) {
        var photoConfig = Settings.getPhotoConfig();

        return timemapService.createTimemapByActor(id, start, end, highlights, infoWindowCallback, photoConfig)
        .then(function(timemap) {
            tm = timemap;
            map = timemap.getNativeMap();
            map.setOptions({ zoomControl: true });

            //	control not to ever zoom too close up:
            var zminlistener = google.maps.event.addListener(map, 'idle', function() {
                if (map.getZoom() > 8) map.setZoom(8);
                if (map.getZoom() < 2) {
                    map.setZoom(5);
                    map.setCenter({lat: 62.0, lng: 25.0 });
                }
                google.maps.event.removeListener(zminlistener);
            });

            var band = tm.timeline.getBand(1);
            if (!tm.getItems().length) {
                band.setCenterVisibleDate(new Date(winterWarHighlights[0].startDate));
            }

            getCasualtyCount();
            timemapService.setOnMouseUpListener(onMouseUpListener);
            band.addOnScrollListener(clearHeatmap);
            tm.timeline.setAutoWidth();
            getCasualtyLocations().then(function(locations) {
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: locations,
                    radius: 30
                });
                self.updateHeatmap();
            });
        });
    };

    var worldWarHighlight = {
        startDate: '1939-09-01',
        endDate: '1945-09-02',
        color:      '#F2F2F2',
        opacity:    20,
        startLabel: 'Toinen maailmansota',
        endLabel:   '',
        cssClass: 'band-highlight'
    };

    var winterWarHighlights = [{
        startDate: '1939-11-30',
        endDate: '1940-03-13',
        color:      '#94BFFF',
        opacity:    20,
        startLabel: 'Talvisota',
        endLabel:   '',
        cssClass: 'band-highlight'
    }];

    var winterWarTimeSpan = {
        start: '1939-07-01',
        end: '1940-04-30'
    };

    self.showWinterWar = function(id) {
        return self.createTimeMap(id, worldWarHighlight.startDate, worldWarHighlight.endDate, winterWarHighlights);
    };

    self.createTimeMapForActor = function(id) {
        self.currentUnitId = id;
        return self.showWinterWar(id);
    };

    self.updateByUri = function(uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = false;
        unitService.getById(uri).then(function(unit) {
            self.current = unit;
            self.isLoadingEvent = false;
            unitService.fetchRelated(unit, true);
            return self.createTimeMapForActor(uri);
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    };

    self.items= [];
    self.queryregex='';

    self.getItems= function () {
        var rx = self.queryregex;
        var testAlphabet = /[^.0-9 ]/g;

        if (rx.length<1) { rx='^1.*$'; }
        else if (!testAlphabet.test(rx)) { rx = '^.*'+rx+'.*$'; }
        else if (rx.length<2) { rx='^'+rx; }
        else if (rx.length<5) { rx = '(^|^.* )'+rx+'.*$'; }
        else {
        	rx = rx.replace(' ','.*');
        	rx = '^.*'+rx+'.*$'; }

        self.items = [ {id:'#', name:'Etsitään ...'} ];

        unitService.getItems(rx, self).then(function(data) {
            if (data.length) {
                self.items = data; }
            else {
                self.items = [ {id:'#', name:'Ei hakutuloksia.'} ];
            }
        });
    };

    self.getItems();

    self.updateUnit = function () {
        if (self.current && self.current.id) {
            var uri = self.current.id;
            if ($location.search().uri != uri) {
                self.noReload = true;
                $location.search('uri', uri);
            }
            self.updateByUri(uri);
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
        self.current = { name: 'Jalkaväkirykmentti 37', id: 'http://ldf.fi/warsa/actors/actor_940' };
        self.updateUnit();
    }

});
