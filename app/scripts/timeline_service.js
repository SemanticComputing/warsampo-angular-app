'use strict';

var eventTypeThemes = {
    "Sotatoimi": "red",
    "Pommitus": "red",
    "Taistelu": "red",
    "Poliittinen toiminta": "purple"
};

/* Hacks */

Timeline.EventUtils.getNewEventID = function() {
    // global across page
    if (!this._lastEventID) {
        this._lastEventID = 0;
    }
    
    this._lastEventID += 1;
    return "e" + this._lastEventID;
};

/* End hacks */

angular.module('eventsApp')
    .service('timemapService', function($q, eventService, photoService) {
        var oms, map, tl;

        this.setOnMouseUpListener = function(fun) {
            Timeline._Band.prototype._onMouseUp = function() {
                if (this._dragging) {
                    this._dragging = false;
                } else if (this._orthogonalDragging) {
                    this._orthogonalDragging = false;
                } else {
                    return;
                }

                this.getTimeline().setAutoWidth();

                fun();
            };
        };

        this.setTimelineClickHandler = function(fun) {
            Timeline.OriginalEventPainter.prototype._showBubble = function(x, y, evt) {
                fun(evt._obj);
            };
        };

        function arrayfy(obj, value) {
            var val = obj[value];
            if (!val) {
                return;
            }
            return _.isArray(val) ? val : [val];
        }

        function isInProximity(event, photo) {
            if (!event.places) {
                return false;
            }
            var ap = _.pluck(event.places, 'id');
            var bp = photo.place_id;
            var am = arrayfy(event, 'municipality_id');
            var bm = photo.municipality_id;

            var f = _.contains;

            var yes = f(ap, bp) || f(ap, bm) || f(am, bp) || f(am, bm);

            return yes;
        }

        var distinctPhotoData = [];
        var photoSettings = { 
            beforeOffset: 0,
            afterOffset: 0,
            inProximity: true
        };

        function setPhotoHighlight(entry) {
            var start = new Date(entry.start);
            start.setDate(start.getDate() - photoSettings.beforeOffset);
            var end = new Date(entry.options.event.end_time);
            end.setDate(end.getDate() + photoSettings.afterOffset);

            if (_.some(distinctPhotoData, function(photo) {
                var d = new Date(photo.created);

                if (d >= start && d <= end && (!photoSettings.inProximity ||
                        isInProximity(entry.options.event, photo))) {
                    return true;
                }

                return false;
            })) {
                entry.options.hasPhoto = true;
                /*
                entry.options.theme = TimeMapTheme.create(entry.options.theme,
                        { eventTextColor: '#000099' });
                        */
            }
        }

        function createEventObject(e) {
            var entry = {
                start: new Date(e.start_time),
                title: e.description.length < 55 ? e.description : e.description.substr(0, 55) + '...',
                text: e.description.length < 55 ? e.description : e.description.substr(0, 55) + '...',
                color: eventTypeThemes[e.type] || 'orange',
                description: e.description,
                options: {
                    theme: eventTypeThemes[e.type] || 'orange',
                    descTitle: eventService.createTitle(e),
                    description: e.description,
                    event: e
                }
            };
            if (e.start_time !== e.end_time) {
                var end_time = new Date(e.end_time);
                end_time.setHours(23);
                end_time.setMinutes(59);
                entry.end = end_time;
                entry.durationEvent = true;
            } else {
                entry.durationEvent = false;
                entry.end = new Date(e.end_time);
            }

            var points = _(e.places).pluck('point').compact().value();
            var polygons = _(e.places).pluck('polygon').compact().value();
            if (points.length) {

                if (points.length === 1) {
                    entry.point = points[0];
                }
                else {
                    entry.placemarks = [{
                        polyline: points
                    }];
                    points.forEach(function(point) {
                        entry.placemarks.push({ point: point });
                    });
                }
            } else if (polygons.length) {
                // What if there are multiple polygons?
                entry.polygon = e.polygons[0];
            } else {
                entry.options.noPlacemarkLoad = true;
            }
            setPhotoHighlight(entry);

            return entry;
        }

        var createMarker = function(point, e) {
            var marker = new google.maps.Marker({
                position: { lat: parseFloat(point.lat), lng: parseFloat(point.lon) },
                map: map
            });
            marker.event = e;
            oms.addMarker(marker);
            return marker;
        };

        var createPolyline = function(points, e) {
            var line = [];
            points.forEach(function(p) {
                line.push({ lat: parseFloat(p.lat), lng: parseFloat(p.lon) });
            });
            var pl = new google.maps.Polyline({
                path: line,
                map: map
            });
            /*
            pl.addListener('click', function() {
                infoWindowCallback(e);
            });
            */
            return pl;
        };


        var createMarkers = function(e) {
            var point = e.point;
            var res = [];

            if (point) {
                res = [createMarker(point, e)];
            } else if (e.placemarks) {
                e.placemarks.forEach(function(p) {
                    if (p.polyline) {
                        res.push(createPolyline(p.polyline, e));
                    } else {
                        res.push(createMarker(p.point, e));
                    }
                });
            }

            return res;
        };

        var markers = [];
        var allPhotos = [];

        var clearMarkers = function() {
            markers.forEach(function(m) {
                m.setMap(null);
            });
            markers = [];
            oms.clearMarkers();
        };

        var displayVisibleEvents = function(band) {
            clearMarkers();

            var minDate = band.getMinVisibleDate();
            var maxDate = band.getMaxVisibleDate();

            var iterator = band.getEventSource().getEventIterator(minDate, maxDate);

            while (iterator.hasNext()) {
                var e = iterator.next();
                var m = createMarkers(e._obj);
                if (m) {
                    markers = markers.concat(m);
                }
            }

            _.filter(allPhotos, function(p) {
                return new Date(p.created) >= minDate && new Date(p.created) <= maxDate && !_.isArray(p.lat);
            }).forEach(function(p) {
                p.point = { lat: p.lat, lon: p.lon };
                var m = createMarkers(p);
                if (m) {
                    markers = markers.concat(m);
                }
            });
        };

        var attachToMap = function(timeline) {
            var map = new google.maps.Map(document.getElementById('map'),
                    { center: { lat: 64.858972, lng: 27.219131 }, zoom: 4 });

            return { timeline: timeline, map: map };
        };

        var oldTheme;
        var oldEvent;

        var openInfoWindow = function(event, callback) {
            var band = event.timeline.getBand(1);
            var start = band.getMinVisibleDate();
            if (oldEvent) {
                oldEvent.changeTheme(oldTheme);
            }
            oldTheme = _.clone(event.opts.theme);
            event.changeTheme('green');
            oldEvent = event;
            if (callback) {
                callback(event);
            }
            band.setMinVisibleDate(start);

        };

        this.createTimemap = function(start, end, highlights, infoWindowCallback, photoConfig) {
            if (infoWindowCallback) {
                this.setTimelineClickHandler(infoWindowCallback);
            }
            return eventService.getEventsByTimeSpan(start, end).then(function(data) {
                return data;
            }).then(function(data) {
                return photoService.getDistinctPhotoData(start, end, photoConfig.inProximity)
                .then(function(photos) {
                    distinctPhotoData = photos;
                    angular.extend(photoSettings, photoConfig);

                    var bandDecorators1, bandDecorators2;
                    if (highlights) {
                        bandDecorators1 = [];
                        bandDecorators2 = [];
                        highlights.forEach(function(hl) {
                            bandDecorators1.push(new Timeline.SpanHighlightDecorator(hl));
                            bandDecorators2.push(new Timeline.SpanHighlightDecorator(hl));
                        });
                    }

                    var es = new Timeline.DefaultEventSource();
                    var res = [];
                    data.forEach(function(e) {
                        res.push(createEventObject(e));
                    });

                    var theme = Timeline.ClassicTheme.create();
                    theme.timeline_start = new Date(start);
                    theme.timeline_stop = new Date(end);
                    theme.mouseWheel = 'default';

                    es.addEvents(res);

                    var bandInfo = [
                        Timeline.createBandInfo({
                            date: es.getEarliestDate(),
                            eventSource: es,
                            theme: theme,
                            overview: true,
                            width: "40",
                            intervalPixels: 100,
                            intervalUnit: Timeline.DateTime.MONTH,
                            decorators: bandDecorators2
                        }),
                        Timeline.createBandInfo({
                            date: es.getEarliestDate(),
                            eventSource: es,
                            theme: theme,
                            width: "240",
                            intervalPixels: 155,
                            intervalUnit: Timeline.DateTime.DAY,
                            decorators: bandDecorators1
                        }),
                    ];

                    bandInfo[0].syncWith = 1;
                    bandInfo[0].highlight = true;

                    var elem = document.getElementById('timeline');
                    tl = Timeline.create(elem, bandInfo, Timeline.HORIZONTAL);

                    // Add listeners for touch events for mobile support
                    [tl.getBand(0), tl.getBand(1)].forEach(function(band) {
                        SimileAjax.DOM.registerEventWithObject(band._div,"touchmove",band,"_onTouchMove");
                        SimileAjax.DOM.registerEventWithObject(band._div,"touchend",band,"_onTouchEnd");
                        SimileAjax.DOM.registerEventWithObject(band._div,"touchstart",band,"_onTouchStart");
                    });

                    var tm = attachToMap(tl);
                    map = tm.map;
                    oms = new OverlappingMarkerSpiderfier(map, { markersWontMove: true, keepSpiderfied: true });
                    oms.addListener('click', function(marker, event) {
                        infoWindowCallback(marker.event);
                    });

                    tl.getBand(0).addOnScrollListener(displayVisibleEvents);
                    tl.layout();

                    return tm;

            });
        }, function(data) {
            $q.reject(data);
        });
    };
});

