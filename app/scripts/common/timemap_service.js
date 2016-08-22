'use strict';

angular.module('eventsApp')
.service('timemapService', function($q, $timeout, _, Timeline, TimeMapTheme, TimeMap,
            SimileAjax, eventService, photoService, EVENT_TYPES) {

    /* Public API */

    this.createTimemapWithPhotoHighlight = createTimemapWithPhotoHighlight;
    this.createTimemapByTimeSpan = createTimemapByTimeSpan;
    this.createTimemapByActor = createTimemapByActor;
    this.createTimemap = createTimemap;

    this.setOnMouseUpListener = setOnMouseUpListener;

    /* Private vars */

    var eventTypeThemes = {};
    eventTypeThemes[EVENT_TYPES.MILITARY_ACTIVITY] = 'red';
    eventTypeThemes[EVENT_TYPES.BOMBARDMENT] = 'red';
    eventTypeThemes[EVENT_TYPES.BATTLE] = 'red';
    eventTypeThemes[EVENT_TYPES.POLITICAL_ACTIVITY] = 'red';

    var distinctPhotoData = [];
    var photoSettings = {
        beforeOffset: 0,
        afterOffset: 0,
        inProximity: true
    };

    var oldTheme;
    var oldEvent;

    /* Public API functions */

    /*
     * Set a listener for the onmouseup event on the timeline
     */
    function setOnMouseUpListener(fun) {
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
    }

    /*
     * Create a Timemap in which events that have associated photos
     * are highlighted.
     *
     * Return a promise of the Timemap.
     */
    function createTimemapWithPhotoHighlight(start, end, data,
            highlights, infoWindowCallback, photoConfig, bandInfo) {
        return photoService.getDistinctPhotoData(start, end, photoConfig.inProximity)
            .then(function(photos) {
                return createTimemap(start, end, data, highlights,
                    infoWindowCallback, photos, photoConfig, bandInfo);
            });
    }

    /*
     * Create a Timemap by a time span (start and end dates as ISO strings)
     *
     * Return a promise of the Timemap.
     */
    function createTimemapByTimeSpan(start, end, highlights, infoWindowCallback, photoConfig) {
        var self = this;
        return eventService.getEventsByTimeSpan(start, end).then(function(data) {
            return self.createTimemapWithPhotoHighlight(start, end, data, highlights, infoWindowCallback, photoConfig);
        }, function(data) {
            $q.reject(data);
        });
    }

    /*
     * Create a Timemap where all events in which the given actor has participated in.
     *
     * Return a promise of the Timemap.
     */
    function createTimemapByActor(actorId, start, end, highlights, infoWindowCallback, photoConfig) {

        var bandInfo = getDefaultBandInfo(start, end, highlights);
        bandInfo[1].intervalPixels = 50;

        var self = this;
        return eventService.getUnitAndSubUnitEventsByUnitId(actorId).then(function(data) {
            return self.createTimemapWithPhotoHighlight(start, end, data,
                highlights, infoWindowCallback, photoConfig, bandInfo);
        }, function(data) {
            $q.reject(data);
        });
    }

    /*
     * Create a Timemap.
     *
     * This function is used by all the other create functions to actually
     * create the Timemap.
     *
     * Return a promise of the Timemap.
     */
    function createTimemap(start, end, events, highlights,
            infoWindowCallback, photoData, photoConfig, bandInfo) {
        distinctPhotoData = photoData || [];
        angular.extend(photoSettings, photoConfig);

        var res = [];
        events.forEach(function(e) {
            res.push(createEventObject(e));
        });

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
            tm.getNativeMap().setOptions({ zoomControl: true });

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

    function createEventObject(e) {
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
            entry.polygon = e.polygons[0];
        } else {
            entry.options.noPlacemarkLoad = true;
        }
        setPhotoHighlight(entry);

        return entry;
    }

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

        var ap = _.map(event.places, 'id');
        var am = arrayfy(event, 'municipality_id');
        var bp = arrayfy(photo, 'place_id');
        var bm = arrayfy(photo, 'municipality_id');

        var eventPlaces = ap.concat(am);
        var photoPlaces = bp.concat(bm);

        var yes = !!_.intersection(eventPlaces, photoPlaces).length;

        //var yes = f(ap, bp) || f(ap, bm) || f(am, bp) || f(am, bm);

        return yes;
    }

});

/* =============================
*  Patch TimeMap and Timeline
*  ============================= */

// Working changeTheme

TimeMapItem.prototype.changeTheme = function(newTheme, suppressLayout) {
    var item = this,
        type = item.getType(),
        event = item.event,
        placemark = item.placemark;

    newTheme = TimeMap.util.lookup(newTheme, TimeMap.themes);
    newTheme.eventIconPath = item.opts.theme.eventIconPath;
    newTheme.eventIcon = newTheme.eventIconPath + newTheme.eventIconImage;
    item.opts.theme = newTheme;
    // internal function - takes type, placemark
    function changePlacemark(pm) {
        if (pm.proprietary_marker) {
            pm.proprietary_marker.setIcon(newTheme.icon);
        } else {
            pm.proprietary_polyline.setOptions({strokeColor: newTheme.color});
        }
    }
    // change placemark
    if (placemark) {
        if (type === 'array') {
            placemark.forEach(changePlacemark);
        } else {
            changePlacemark(placemark);
        }
    }
    // change event
    if (event) {
        event._color = newTheme.eventColor;
        event._icon = newTheme.eventIcon;
        if (!suppressLayout) {
            item.timeline.layout();
        }
    }
};


// Timeline.createBandInfo from version 2.3.1

Timeline._Band.prototype.updateEventTrackInfo = function(A, B) {
    this._eventTrackIncrement = B;
    if (true || A > this._eventTracksNeeded) {
      this._eventTracksNeeded = A
    }
}

Timeline.createBandInfo = function(params) {
    var theme = ("theme" in params) ? params.theme : Timeline.getDefaultTheme();

    var decorators = ("decorators" in params) ? params.decorators : [];

    var eventSource = ("eventSource" in params) ? params.eventSource : null;

    var ether = new Timeline.LinearEther({
        centersOn:          ("date" in params) ? params.date : new Date(),
        interval:           SimileAjax.DateTime.gregorianUnitLengths[params.intervalUnit],
        pixelsPerInterval:  params.intervalPixels,
        theme:              theme
    });

    var etherPainter = new Timeline.GregorianEtherPainter({
        unit:       params.intervalUnit,
        multiple:   ("multiple" in params) ? params.multiple : 1,
        theme:      theme,
        align:      ("align" in params) ? params.align : undefined
    });

    var eventPainterParams = {
        showText:   ("showEventText" in params) ? params.showEventText : true,
        theme:      theme
    };
    // pass in custom parameters for the event painter
    if ("eventPainterParams" in params) {
        for (var prop in params.eventPainterParams) {
            eventPainterParams[prop] = params.eventPainterParams[prop];
        }
    }

    if ("trackHeight" in params) {
        eventPainterParams.trackHeight = params.trackHeight;
    }
    if ("trackGap" in params) {
        eventPainterParams.trackGap = params.trackGap;
    }

    var layout = ("overview" in params && params.overview) ? "overview" : ("layout" in params ? params.layout : "original");
    var eventPainter;
    if ("eventPainter" in params) {
        eventPainter = new params.eventPainter(eventPainterParams);
    } else {
        switch (layout) {
            case "overview" :
                eventPainter = new Timeline.OverviewEventPainter(eventPainterParams);
                break;
            case "detailed" :
                eventPainter = new Timeline.DetailedEventPainter(eventPainterParams);
                break;
            default:
                eventPainter = new Timeline.OriginalEventPainter(eventPainterParams);
        }
    }

    return {
        width:          params.width,
        eventSource:    eventSource,
        timeZone:       ("timeZone" in params) ? params.timeZone : 0,
        ether:          ether,
        etherPainter:   etherPainter,
        eventPainter:   eventPainter,
        theme:          theme,
        decorators:     decorators,
        zoomIndex:      ("zoomIndex" in params) ? params.zoomIndex : 0,
        zoomSteps:      ("zoomSteps" in params) ? params.zoomSteps : null
    };
};

// Always resize and always animate resize

Timeline._Impl.prototype.setAutoWidth = function(okToShrink) {
    var timeline = this; // this Timeline
    var immediateChange = false; // timeline._starting;
    var newWidth = 0;

    function changeTimelineWidth() {
        var widthStyle = timeline.getWidthStyle();
        if (immediateChange) {
            timeline._containerDiv.style[widthStyle] = newWidth + 'px';
        } else {
            // animate change
            timeline._autoResizing = true;
            var animateParam ={};
            animateParam[widthStyle] = newWidth + 'px';

            SimileAjax.jQuery(timeline._containerDiv).animate(
                    animateParam, timeline.autoWidthAnimationTime,
                    'linear', function(){timeline._autoResizing = false;});
        }
    }

    function checkTimelineWidth() {
        var targetWidth = 0; // the new desired width
        var currentWidth = timeline.getPixelWidth();

        if (timeline._autoResizing) {
            return; // early return
        }

        // compute targetWidth
        for (var i = 0; i < timeline._bands.length; i++) {
            timeline._bands[i].setAutoWidth();
            targetWidth += parseInt(timeline._bandInfos[i].width);
        }

        if (targetWidth > currentWidth || okToShrink || true) {
            // yes, let's change the size
            newWidth = targetWidth;
            changeTimelineWidth();
            timeline._distributeWidths();
        }
    }
    checkTimelineWidth();
};

Timeline._Band.prototype.setAutoWidth = function() {
    // if a new (larger) width is needed by the band
    // then: a) updates the band's bandInfo.width
    //
    // desiredWidth for the band is
    //   (number of tracks + margin) * track increment

    var overviewBand = this._eventPainter.getType() == 'overview';
    var margin = overviewBand ?
       this._theme.event.overviewTrack.autoWidthMargin :
       this._theme.event.track.autoWidthMargin;
    var desiredWidth = Math.ceil((this._eventTracksNeeded + margin) *
                       this._eventTrackIncrement);
    // add offset amount (additional margin)
    desiredWidth += overviewBand ? this._theme.event.overviewTrack.offset :
                                   this._theme.event.track.offset;
    var bandInfo = this._bandInfo;

    if (desiredWidth > bandInfo.width || true) {
        bandInfo.width = desiredWidth;
    }
};

// Support for mobile devices

Timeline._Band.prototype._onTouchStart = function(D,A,E) {
    if (A.touches.length == 1) {
        var touch = A.changedTouches[0];
        this._dragX=touch.clientX;
        this._dragY=touch.clientY;
        this._dragging=true;
    }
};

Timeline._Band.prototype._onTouchMove = function(D,A,E) {
    if (A.touches.length == 1) {
        A.preventDefault();
        A.stopPropagation();
        A.stopImmediatePropagation();
        var touch = A.changedTouches[0];
        var C=touch.clientX-this._dragX;
        var B=touch.clientY-this._dragY;
        this._dragX=touch.clientX;
        this._dragY=touch.clientY;
        this._moveEther(this._timeline.isHorizontal()?C:B);
        this._positionHighlight();
        this._fireOnScroll();
        this._setSyncWithBandDate();
    }
};

Timeline._Band.prototype._onTouchEnd = function() {
    this._dragging=false;
};

/* End patches */

