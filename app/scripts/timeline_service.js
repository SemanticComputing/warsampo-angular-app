'use strict';

var eventTypeThemes = {
    "Sotatoimi": "red",
    "Pommitus": "red",
    "Taistelu": "red",
    "Poliittinen toiminta": "purple"
};

angular.module('eventsApp')
    .service('timemapService', function($q, eventService) {

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


        function createEventObject(e) {
            var entry = {
                start: e.start_time,
                title: e.description.length < 20 ? e.description : e.description.substr(0, 20) + '...',
                color: eventTypeThemes[e.type],
                options: {
                    place_uri: e.place_id,
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
            return (function() {
                return (start && end) ? eventService.getEventsByTimeSpan(start, end) : eventService.getAllEvents();
            })().then(function(data) {

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

                var bandInfo = [
                    Timeline.createBandInfo({
                        theme: theme,
                        width: "240",
                        intervalPixels: 155,
                        intervalUnit: Timeline.DateTime.DAY,
                        decorators: bandDecorators1
                    }),
                    Timeline.createBandInfo({
                        theme: theme,
                        overview: true,
                        width: "40",
                        intervalPixels: 100,
                        intervalUnit: Timeline.DateTime.MONTH,
                        decorators: bandDecorators2
                    })
                ];

                bandInfo[1].syncWith = 0;

                var es = new Timeline.DefaultEventSource();
                var elem = document.getElementById('timeline');
                console.log(elem);
                var tl = Timeline.create(elem, bandInfo, Timeline.HORIZONTAL);

                es.loadJSON(res, '.');

                tl.layout();

                return tl;

            }, function(data) {
                $q.reject(data);
            });
        };
    });

