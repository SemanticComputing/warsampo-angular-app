(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .service('timemapService', function($q, $timeout, $window, _, Timeline, TimeMapTheme, TimeMap,
            SimileAjax, eventService, photoService, EVENT_TYPES) {

        /* Public API */

        // Function(start, end, data, highlights, infoWindowCallback, photoConfig,
        //      bandInfo, existingTimemap) -> promise (timemap instance)
        this.createTimemapWithPhotoHighlight = createTimemapWithPhotoHighlight;
        // Function(start, end, highlights, infoWindowCallback,
        //      photoConfig, existingTimemap) -> promise (timemap instance)
        this.createTimemapByTimeSpan = createTimemapByTimeSpan;
        // Function(unitId, start, end, highlights, infoWindowCallback,
        //      photoConfig, existingTimemap) -> promise (timemap instance)
        this.createTimemapByUnit = createTimemapByUnit;
        // Function(start, end, events, highlights, infoWindowCallback,
        //      photoData, photoConfig, bandInfo, existingTimemap) -> promise (timemap instance)
        this.createTimemap = createTimemap;

        this.setOnMouseUpListener = setOnMouseUpListener;
        this.addOnScrollListener = addOnScrollListener;
        this.setCenterVisibleDate = setCenterVisibleDate;
        this.getDefaultBandInfo = getDefaultBandInfo;

        this.cleanUp = cleanUp;

        /* Private vars */

        var eventTypeThemes = {};
        eventTypeThemes[EVENT_TYPES.MILITARY_ACTIVITY] = 'red';
        eventTypeThemes[EVENT_TYPES.BOMBARDMENT] = 'red';
        eventTypeThemes[EVENT_TYPES.BATTLE] = 'red';
        eventTypeThemes[EVENT_TYPES.POLITICAL_ACTIVITY] = 'purple';

        var photoSettings = {
            beforeOffset: 0,
            afterOffset: 0,
            inProximity: true
        };

        // TODO: this should be a stateless service or a service constructor
        var oldTheme;
        var oldEvent;

        function cleanUp() {
            // Remove the onresize function set by Timemap...
            $window.onresize = undefined;
            oldTheme = undefined;
            oldEvent = undefined;
        }

        /* Public API functions */

        /*
        * Set a listener for the onmouseup event on the timeline
        */
        function setOnMouseUpListener(tm, fun) {
            [tm.timeline.getBand(0), tm.timeline.getBand(1)].forEach(function(band) {
                band._onMouseUp = function() {
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
            });
        }

        /*
        /* Add a scroll listener to the timeline
         */
        function addOnScrollListener(tm, fun) {
            tm.timeline.getBand(1).addOnScrollListener(fun);
        }

        /*
         * Set center visible date of the timeline
         */
        function setCenterVisibleDate(tm, date) {
            tm.timeline.getBand(1).setCenterVisibleDate(date);
            tm.timeline.setAutoWidth();
        }

        /*
        * Create a Timemap in which events that have associated photos
        * are highlighted.
        *
        * If existingTimemap is given, the events of that timemap instance are
        * replaced with new ones instead of creating a new timemap instance.
        *
        *
        * Return a promise of the Timemap.
        */
        function createTimemapWithPhotoHighlight(start, end, data,
                highlights, infoWindowCallback, photoConfig, bandInfo, existingTimemap) {
            return photoService.getDistinctPhotoData(start, end, photoConfig.inProximity)
            .then(function(photos) {
                return createTimemap(start, end, data, highlights,
                    infoWindowCallback, photos, photoConfig, bandInfo, existingTimemap);
            }).catch(function(data) {
                return $q.reject(data);
            });
        }

        /*
        * Create a Timemap by a time span (start and end dates as ISO strings)
        *
        * If existingTimemap is given, the events of that timemap instance are
        * replaced with new ones instead of creating a new timemap instance.
        *
        *
        * Return a promise of the Timemap.
        */
        function createTimemapByTimeSpan(start, end, highlights, infoWindowCallback,
                photoConfig, existingTimemap) {
            var self = this;
            return eventService.getEventsByTimeSpan(start, end).then(function(data) {
                return self.createTimemapWithPhotoHighlight(start, end, data, highlights,
                    infoWindowCallback, photoConfig, existingTimemap);
            }).catch(function(data) {
                return $q.reject(data);
            });
        }

        /*
        * Create a Timemap where all events in which the given unit has participated in.
        *
        * If existingTimemap is given, the events of that timemap instance are
        * replaced with new ones instead of creating a new timemap instance.
        *
        * Return a promise of the Timemap.
        */
        function createTimemapByUnit(unitId, start, end, highlights, infoWindowCallback,
                photoConfig, existingTimemap) {

            var bandInfo = getDefaultBandInfo(start, end, highlights);
            bandInfo[1].intervalPixels = 50;

            var self = this;
            return eventService.getUnitAndSubUnitEventsByUnitId(unitId)
            .then(function(data) {
                return self.createTimemapWithPhotoHighlight(start, end, data,
                    highlights, infoWindowCallback, photoConfig, bandInfo, existingTimemap);
            }).catch(function(data) {
                return $q.reject(data);
            });
        }

        /*
        * Create a Timemap.
        *
        * This function is used by all the other create functions to actually
        * create the Timemap.
        *
        * If existingTimemap is given, the events of that timemap instance are
        * replaced with new ones instead of creating a new timemap instance.
        *
        * Return a promise of the Timemap.
        */
        function createTimemap(start, end, events, highlights,
                infoWindowCallback, photoData, photoConfig, bandInfo, existingTimemap) {
            var distinctPhotoData = photoData || [];
            angular.extend(photoSettings, photoConfig);

            var res = [];
            events.forEach(function(e) {
                res.push(createEventObject(e, distinctPhotoData));
            });

            if (existingTimemap) {
                var dataset = existingTimemap.datasets.warsa;
                dataset.clear();
                dataset.loadItems(res);
                return $q.when(existingTimemap);
            }

            // Use timeout to let the template (or more specifically the map div)
            // render before creating the timemap.
            return $timeout(function() {
                return TimeMap.init({
                    mapId: 'map',               // Id of map div element (required)
                    timelineId: 'timeline',     // Id of timeline div element (required)
                    options: {
                        // NB! THE FOLLOWING LINE (eventIconPath...) WILL BE REPLACED BY GRUNT BUILD!
                        // Any change to the line will break the build as it currently stands.
                        eventIconPath: 'vendor/timemap/images/',
                        openInfoWindow: function() { openInfoWindow(this, infoWindowCallback); }
                    },
                    datasets: [{
                        id: 'warsa',
                        title: 'Itsenäisen Suomen sotien tapahtumat',
                        theme: 'orange',
                        type: 'basic',
                        options: {
                            items: res
                        }
                    }],
                    bandInfo: bandInfo || getDefaultBandInfo(start, end, highlights)
                });
            }, 0).then(function(tm) {
                // Add listeners for touch events for mobile support
                [tm.timeline.getBand(0), tm.timeline.getBand(1)].forEach(function(band) {
                    SimileAjax.DOM.registerEventWithObject(band._div,'touchmove',band,'_onTouchMove');
                    SimileAjax.DOM.registerEventWithObject(band._div,'touchend',band,'_onTouchEnd');
                    SimileAjax.DOM.registerEventWithObject(band._div,'touchstart',band,'_onTouchStart');
                });

                // Add zoom controls to the map.
                tm.getNativeMap().setOptions({ zoomControl: true, mapTypeId: 'satellite' });

                return tm;
            });
        }

        /* Utility functions */

        function getDefaultBandInfo(start, end, highlights) {
            var bandDecorators1, bandDecorators2;
            if (highlights) {
                bandDecorators1 = [];
                bandDecorators2 = [];
                highlights.forEach(function(hl) {
                    bandDecorators1.push(new Timeline.SpanHighlightDecorator(hl));
                    bandDecorators2.push(new Timeline.SpanHighlightDecorator(hl));
                });
            }

            var theme = Timeline.ClassicTheme.create();
            theme.timeline_start = new Date(start);
            theme.timeline_stop = new Date(end);
            theme.mouseWheel = 'default';

            var defaultBandInfo = [
                {
                    theme: theme,
                    overview: true,
                    width: '40',
                    intervalPixels: 100,
                    intervalUnit: Timeline.DateTime.MONTH,
                    decorators: bandDecorators1
                },
                {
                    theme: theme,
                    width: '240',
                    intervalPixels: 155,
                    intervalUnit: Timeline.DateTime.DAY,
                    decorators: bandDecorators2
                }
            ];
            return defaultBandInfo;
        }

        function openInfoWindow(event, callback) {
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
        }

        function createEventObject(e, distinctPhotoData) {
            var description = e.getDescription();
            var entry = {
                start: new Date(e.start_time),
                title: description.length < 50 ? description : description.substr(0, 47) + '...',
                options: {
                    theme: eventTypeThemes[e.type_id] || 'orange',
                    descTitle: e.timeSpanString,
                    description: description,
                    event: e
                }
            };
            var end_time;
            if (e.start_time !== e.end_time) {
                end_time = new Date(e.end_time);
                end_time.setHours(23);
                end_time.setMinutes(59);
                entry.end = end_time;
            } else {
                end_time = entry.start;
            }

            var points = _(e.places).map('point').compact().value();
            var polygons = _(e.places).map('polygon').compact().value();
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
                entry.polygon = polygons[0];
            } else {
                entry.options.noPlacemarkLoad = true;
            }
            setPhotoHighlight(entry, distinctPhotoData);

            return entry;
        }

        function setPhotoHighlight(entry, distinctPhotoData) {
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
                entry.options.theme = TimeMapTheme.create(entry.options.theme,
                        { eventTextColor: '#000099' });
            }
        }

        function arrayfy(obj, value) {
            var val = obj[value];
            if (!val) {
                return [];
            }
            return _.isArray(val) ? val : [val];
        }

        function isInProximity(event, photo) {
            if (!event.places) {
                return false;
            }

            var ap = _(event.places).map('id').compact().value();
            var am = _(event.places).map('municipality_id').compact().value();
            var bp = arrayfy(photo, 'place_id');
            var bm = _(photo.places).map('municipality_id').compact().value();

            var eventPlaces = ap.concat(am);
            var photoPlaces = bp.concat(bm);

            var yes = !!_.intersection(eventPlaces, photoPlaces).length;

            return yes;
        }
    });
})();
