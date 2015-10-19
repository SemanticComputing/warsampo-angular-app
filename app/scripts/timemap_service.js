'use strict';

/*
 * Service for querying a SPARQL endpoint.
 * Takes the endpoint URL as a parameter.
 */

/* Patch TimeMap and Timeline */

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

Timeline._Band.prototype._onTouchStart=function(D,A,E)
{
    if(A.touches.length == 1)
    {
        var touch = A.changedTouches[0];
        this._dragX=touch.clientX;
        this._dragY=touch.clientY;
        this._dragging=true;
    }
}

Timeline._Band.prototype._onTouchMove=function(D,A,E)
{
    if(A.touches.length == 1)
    {
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

Timeline._Band.prototype._onTouchEnd=function(){
        this._dragging=false;
};

/* End patches */


var eventTypeThemes = {
    "Sotatoimi": "red",
    "Pommitus": "red",
    "Taistelu": "red",
    "Poliittinen toiminta": "purple"
};

angular.module('eventsApp')
    .service('timemapService', function($q, eventService, photoService) {

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
                entry.options.theme = TimeMapTheme.create(entry.options.theme,
                        { eventTextColor: '#000099' });
            }
        }

        function createEventObject(e) {
            var entry = {
                start: new Date(e.start_time),
                title: e.description.length < 55 ? e.description : e.description.substr(0, 55) + '...',
                options: {
                    theme: eventTypeThemes[e.type] || 'orange',
                    descTitle: eventService.createTitle(e),
                    description: e.description,
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

                    var res = [];
                    data.forEach(function(e) {
                        res.push(createEventObject(e));
                    });

                    var theme = Timeline.ClassicTheme.create();
                    theme.timeline_start = new Date(start);
                    theme.timeline_stop = new Date(end);
                    theme.mouseWheel = 'default';

                    var tm = TimeMap.init({
                        mapId: "map",               // Id of map div element (required)
                        timelineId: "timeline",     // Id of timeline div element (required)
                        options: {
                            eventIconPath: "vendor/timemap/images/",
                            openInfoWindow: function() { openInfoWindow(this, infoWindowCallback); }
                        },
                        datasets: [{
                            id: "warsa",
                            title: "Itsenäisen Suomen sotien tapahtumat",
                            theme: "orange",
                            type: "basic",
                            options: {
                                items: res
                            }
                        }],
                        bandInfo: [
                        {
                            theme: theme,
                            overview: true,
                            width: "40",
                            intervalPixels: 100,
                            intervalUnit: Timeline.DateTime.MONTH,
                            decorators: bandDecorators1
                        },
                        {
                            theme: theme,
                            width: "240",
                            intervalPixels: 155,
                            intervalUnit: Timeline.DateTime.DAY,
                            decorators: bandDecorators2
                        }]
                    });

                    // Add listeners for touch events for mobile support
                    [tm.timeline.getBand(0), tm.timeline.getBand(1)].forEach(function(band) {
                        SimileAjax.DOM.registerEventWithObject(band._div,"touchmove",band,"_onTouchMove");
                        SimileAjax.DOM.registerEventWithObject(band._div,"touchend",band,"_onTouchEnd");
                        SimileAjax.DOM.registerEventWithObject(band._div,"touchstart",band,"_onTouchStart");
                    });

                    return tm;
                });

            }, function(data) {
                $q.reject(data);
            });
        };
    });
