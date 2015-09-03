'use strict';

/*
 * Service for querying a SPARQL endpoint.
 * Takes the endpoint URL as a parameter.
 */
angular.module('eventsApp')
    .service('timemapService', function(eventService) {

        var infoHtml = "<div><h3>{0}</h3><p>{1}</p></div>";

        function createEventObject(e) {
            var entry = {
                start: e.start_time,
                title: e.length < 20 ? e.description : e.description.substr(0, 20) + '...',
                options: {
                    infoHtml: infoHtml.format(eventService.createTitle(e), e.description),
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

        var ib;
        var mark;
        var oldIcon;
        var oldTheme;
        var oldEvent;

        var openInfoWindow = function(event, callback) {
            if (mark) {
                mark.setIcon(oldIcon);
            }
            oldTheme = _.clone(event.opts.theme);
            if (oldEvent) {
                oldEvent.changeTheme(oldTheme);
            }
            oldIcon = undefined;
            if (ib) {
                ib.close();
            }
            var opts = {
                content: event.opts.infoHtml,
                isHidden: false,
                pane: 'floatPane',
                infoBoxClearance: new google.maps.Size(1, 1)
            };
            ib = new InfoBox(opts);
            var map = event.map.maps.googlev3; 
            //mark = event.placemark;
            mark = event.getNativePlacemark();
            if (mark) {
                oldIcon = mark.getIcon();
                mark.setIcon('https://www.google.com/mapfiles/marker_green.png');
            }
            event.changeTheme('purple');
            oldEvent = event;
            /*
            if (_.isArray(event.placemark)) {
                var m = event.placemark.pop();
                console.log(m);
            }
            console.log(event);
            if (mark) {
                oldIcon = mark.getIcon();
                mark.setIcon('https://www.google.com/mapfiles/marker_green.png');
            }
            */
            if (callback) {
                callback(event);
            }
            //TimeMapItem.openInfoWindowBasic.call(this);
        };

        this.createTimemap = function(start, end, infoWindowCallback) {
            (function() {
                return (start && end) ? eventService.getEventsByTimeSpan(start, end) : eventService.getAllEvents();
            })().then(function(data) {
                var res = [];
                data.forEach(function(e) {
                    res.push(createEventObject(e));
                });
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
                        bandIntervals: [
                            Timeline.DateTime.DAY, 
                            Timeline.DateTime.MONTH
                        ]
                });

                return tm;

            }, function(data) {
                throw data;
            });
        };
    });

