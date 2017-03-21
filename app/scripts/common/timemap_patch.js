/* =============================
*  Patch TimeMap and Timeline
*  ============================= */

// Working changeTheme

(function(TimeMap, TimeMapItem, Timeline, SimileAjax) {

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
            this._eventTracksNeeded = A;
        }
    };

    Timeline.createBandInfo = function(params) {
        var theme = ('theme' in params) ? params.theme : Timeline.getDefaultTheme();

        var decorators = ('decorators' in params) ? params.decorators : [];

        var eventSource = ('eventSource' in params) ? params.eventSource : null;

        var ether = new Timeline.LinearEther({
            centersOn:          ('date' in params) ? params.date : new Date(),
            interval:           SimileAjax.DateTime.gregorianUnitLengths[params.intervalUnit],
            pixelsPerInterval:  params.intervalPixels,
            theme:              theme
        });

        var etherPainter = new Timeline.GregorianEtherPainter({
            unit:       params.intervalUnit,
            multiple:   ('multiple' in params) ? params.multiple : 1,
            theme:      theme,
            align:      ('align' in params) ? params.align : undefined
        });

        var eventPainterParams = {
            showText:   ('showEventText' in params) ? params.showEventText : true,
            theme:      theme
        };
        // pass in custom parameters for the event painter
        if ('eventPainterParams' in params) {
            for (var prop in params.eventPainterParams) {
                eventPainterParams[prop] = params.eventPainterParams[prop];
            }
        }

        if ('trackHeight' in params) {
            eventPainterParams.trackHeight = params.trackHeight;
        }
        if ('trackGap' in params) {
            eventPainterParams.trackGap = params.trackGap;
        }

        var layout = ('overview' in params && params.overview) ? 'overview' : ('layout' in params ? params.layout : 'original');
        var eventPainter;
        if ('eventPainter' in params) {
            eventPainter = new params.eventPainter(eventPainterParams);
        } else {
            switch (layout) {
                case 'overview' :
                    eventPainter = new Timeline.OverviewEventPainter(eventPainterParams);
                    break;
                case 'detailed' :
                    eventPainter = new Timeline.DetailedEventPainter(eventPainterParams);
                    break;
                default:
                    eventPainter = new Timeline.OriginalEventPainter(eventPainterParams);
            }
        }

        return {
            width:          params.width,
            eventSource:    eventSource,
            timeZone:       ('timeZone' in params) ? params.timeZone : 0,
            ether:          ether,
            etherPainter:   etherPainter,
            eventPainter:   eventPainter,
            theme:          theme,
            decorators:     decorators,
            zoomIndex:      ('zoomIndex' in params) ? params.zoomIndex : 0,
            zoomSteps:      ('zoomSteps' in params) ? params.zoomSteps : null
        };
    };

    // Apply highlights to a band with hotzones

    var createHotZoneBandInfo = Timeline.createHotZoneBandInfo;

    Timeline.createHotZoneBandInfo = function(params) {
        var res = createHotZoneBandInfo.bind(Timeline)(params);
        if (params.decorators) {
            res.decorators = params.decorators;
        }
        return res;
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

    Timeline._Band.prototype._onTouchStart = function(D, A, E) {
        if (A.touches.length == 1) {
            var touch = A.changedTouches[0];
            this._dragX = touch.clientX;
            this._dragY = touch.clientY;
            this._dragging = true;
        }
    };

    Timeline._Band.prototype._onTouchMove = function(D, A, E) {
        if (A.touches.length == 1) {
            A.preventDefault();
            A.stopPropagation();
            A.stopImmediatePropagation();
            var touch = A.changedTouches[0];
            var C = touch.clientX-this._dragX;
            var B = touch.clientY-this._dragY;
            this._dragX = touch.clientX;
            this._dragY = touch.clientY;
            this._moveEther(this._timeline.isHorizontal() ? C : B);
            this._positionHighlight();
            this._fireOnScroll();
            this._setSyncWithBandDate();
        }
    };

    Timeline._Band.prototype._onTouchEnd = function() {
        this._dragging=false;
    };

})(TimeMap, TimeMapItem, Timeline, SimileAjax);
