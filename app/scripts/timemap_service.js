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

        if (targetWidth > currentWidth || okToShrink) {
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
    
    if (desiredWidth > bandInfo.width) {
        bandInfo.width = desiredWidth;
    }
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

        function someArray(a, b) {
            return _.some(a, function(ap) {
                return _.some(b, function(bp) {
                    return ap === bp;
                });
            });
        }

        function isInProximity(a, b) {
            if (!(a.place_id && b.place_id)) {
                return false;
            }
            var ap = arrayfy(a, 'place_id');
            var bp = arrayfy(b, 'place_id');
            var am = arrayfy(a, 'municipality');
            var bm = arrayfy(b, 'municipality');

            if (!(ap && bp)) {
                return false;
            }

            var f = someArray;

            var yes = f(ap, bp) || f(ap, bm) || f(bp, am) || f(am, bm);

            return yes;
        }

        var allPhotos = [];

        function createEventObject(e) {
            var entry = {
                start: new Date(e.start_time),
                title: e.description.length < 20 ? e.description : e.description.substr(0, 20) + '...',
                options: {
                    theme: eventTypeThemes[e.type] || 'orange',
                    place_uri: e.place_id,
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

            if (e.points) {
                if (e.points.length === 1) {
                    entry.point = e.points[0];
                }
                else {
                    entry.placemarks = [{
                        polyline: e.points
                    }];
                    e.points.forEach(function(point) {
                        entry.placemarks.push({ point: point });
                    });
                }
            } else if (e.polygons) {
                entry.polygon = e.polygons[0];
            } else {
                entry.options.noPlacemarkLoad = true;
            }
            var start = new Date(entry.start);
            start.setDate(start.getDate() -1);
            var end = new Date(end_time);
            end.setDate(end.getDate() + 3);
            
            if (_.some(allPhotos, function(photo) {
                if (photo.created) {
                    var d = new Date(photo.created);

                    if ((d >= start && d <= end) && isInProximity(e, photo)) {
                        return true;
                    }
                }
                return false;
            })) {
                entry.options.hasPhoto = true;
                entry.options.theme = TimeMapTheme.create(entry.options.theme,
                        { eventTextColor: '#000099' });
            }

            return entry;
        }

        var oldTheme;
        var oldEvent;

        var openInfoWindow = function(event, callback) {
            var band = event.timeline.getBand(0);
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

        this.createTimemap = function(start, end, highlights, infoWindowCallback) {
            return eventService.getEventsByTimeSpan(start, end).then(function(data) {
                return data;
            }).then(function(data) {
                return photoService.getPhotosWithPlaceByTimeSpan(start, end).then(function(photos) {
                    allPhotos = photos;

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

                    var tm = TimeMap.init({
                        mapId: "map",               // Id of map div element (required)
                        timelineId: "timeline",     // Id of timeline div element (required)
                        options: {
                            eventIconPath: "vendor/timemap/images/",
                            openInfoWindow: function() { openInfoWindow(this, infoWindowCallback); },
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
                            width: "240",
                            intervalPixels: 155,
                            intervalUnit: Timeline.DateTime.DAY,
                            decorators: bandDecorators1
                        },
                        {
                            theme: theme,
                            overview: true,
                            width: "40",
                            intervalPixels: 100,
                            intervalUnit: Timeline.DateTime.MONTH,
                            decorators: bandDecorators2
                        }]
                    });

                    return tm;
                });

            }, function(data) {
                $q.reject(data);
            });
        };
    });

