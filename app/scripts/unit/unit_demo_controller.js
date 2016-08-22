(function() {
    'use strict';

    angular.module('eventsApp')
    .controller('UnitDemoCtrl', UnitDemoController);

    /* @ngInject */
    function UnitDemoController($routeParams, $location, $scope, $q,
            _, eventService, photoService, casualtyRepository, unitService,
            Settings, timemapService, googleMapsService, WAR_INFO) {

        var self = this;

        var defaultUnit = 'http://ldf.fi/warsa/actors/actor_940';
        var tm, map, heatmap;

        // Images related to currently selected event
        self.images = undefined;
        // List of units in the search input
        self.items = [];
        // User search input
        self.queryregex = '';

        self.getItems = getItems;
        self.updateUnit = updateUnit;

        // Petri's testings:
        self.testUnitPath = false;
        self.unitPath = false;

        init();

        /* Implementation */

        function init() {
            Settings.setHelpFunction(showHelp);
            $scope.$on('$destroy', function() {
                Settings.clearEventSettings();
            });

            getItems();

            if ($routeParams.uri) {
                return updateByUri($routeParams.uri);
            } else {
                self.current = { id: defaultUnit };
                return updateUnit();
            }
        }

        function createTimeMapForActor(id) {
            self.currentUnitId = id;
            return showWinterWar(id);
        }

        function showWinterWar(id) {
            return createTimeMap(id, WAR_INFO.winterWarTimeSpan.start,
                    WAR_INFO.continuationWarTimeSpan.end, WAR_INFO.winterWarHighlights);
        }

        function createTimeMap(id, start, end, highlights) {
            var photoConfig = Settings.getPhotoConfig();

            return timemapService.createTimemapByActor(id, start, end, highlights,
                    infoWindowCallback, photoConfig)
            .then(function(timemap) {
                tm = timemap;
                map = timemap.getNativeMap();

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
                    band.setCenterVisibleDate(new Date(WAR_INFO.winterWarHighlights[0].startDate));
                }

                getCasualtyCount();
                timemapService.setOnMouseUpListener(onMouseUpListener);
                band.addOnScrollListener(clearHeatmap);
                tm.timeline.setAutoWidth();
                updateHeatmap();
            });
        }

        function getItems() {
            var rx = self.queryregex;
            var testAlphabet = /[^.0-9 ]/g;

            if (rx.length<1) { rx='^1.*$'; }
            else if (!testAlphabet.test(rx)) { rx = '^.*'+rx+'.*$'; }
            else if (rx.length<2) { rx='^'+rx; }
            else if (rx.length<5) { rx = '(^|^.* )'+rx+'.*$'; }
            else {
                rx = rx.replace(' ','.*');
                rx = '^.*'+rx+'.*$';
            }

            self.items = [ {id:'#', name:'Etsitään ...'} ];

            return unitService.getItems(rx).then(function(data) {
                if (data.length) {
                    self.items = data;
                }
                else {
                    self.items = [ {id:'#', name:'Ei hakutuloksia.'} ];
                }
                return self.items;
            });
        }

        function updateByUri(uri) {
            self.isLoadingEvent = true;
            self.isLoadingLinks = false;
            return unitService.getById(uri).then(function(unit) {
                self.current = unit;
                self.isLoadingEvent = false;
                unitService.fetchRelated(unit, true);
                return createTimeMapForActor(uri);
            }).catch(function() {
                self.isLoadingEvent = false;
                self.isLoadingLinks = false;
            });
        }

        function updateUnit() {
            if (self.current && self.current.id) {
                var uri = self.current.id;
                if ($location.search().uri != uri) {
                    $location.search('uri', uri);
                }
                return updateByUri(uri);
            }
            return $q.when();
        }

        function showHelp() {
            self.current = undefined;
        }

        function getCasualtyCount() {
            var band = tm.timeline.getBand(1);
            var start = band.getMinVisibleDate();
            var end = band.getMaxVisibleDate();
            var unit = self.currentUnitId;

            self.minVisibleDate = start;
            self.maxVisibleDate = end;
            casualtyRepository.getCasualtyCountsByTimeGroupByUnitAndType(start.toISODateString(),
                    end.toISODateString(), unit)
            .then(function(counts) {
                self.casualtyStats = counts;
                var count = 0;
                counts.forEach(function(type) {
                    count += parseInt(type.count);
                });
                self.casualtyCount = count;
            });
        }

        function getCasualtyLocations() {
            var band = tm.timeline.getBand(1);
            var start = band.getMinVisibleDate();
            var end = band.getMaxVisibleDate();
            var unit = self.currentUnitId;
            return casualtyRepository.getCasualtyLocationsByTimeAndUnit(start.toISODateString(),
                    end.toISODateString(), unit);
        }

        function updateHeatmap() {
            if (Settings.showCasualtyHeatmap) {
                getCasualtyLocations().then(function(locations) {
                    if (!heatmap) {
                        heatmap = googleMapsService.createHeatmap();
                    }
                    googleMapsService.updateHeatmap(heatmap, locations, map);
                });
            } else {
                googleMapsService.clearHeatmap(heatmap);
            }
        }

        function onMouseUpListener() {
            updateHeatmap();
            getCasualtyCount();
        }

        function clearHeatmap() {
            if (tm.timeline.getBand(0)._dragging || tm.timeline.getBand(1)._dragging) {
                googleMapsService.createHeatmap(heatmap);
            }
        }

        function fetchImages(item) {
            var photoConfig = Settings.getPhotoConfig();
            if (item.opts.event) {
                photoService.getRelatedPhotosForEvent(item.opts.event, photoConfig).then(function(imgs) {
                    self.images = imgs;
                });
            }
        }

        function infoWindowCallback(item) {
            self.current = item;
            eventService.fetchRelated(item.opts.event);
            fetchImages(item);
        }

        function averagePath(casualties) {
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

        function drawUnitPath(coords) {
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
        }

    }
})();
