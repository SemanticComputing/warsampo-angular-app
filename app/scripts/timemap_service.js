'use strict';

/*
 * Service for querying a SPARQL endpoint.
 * Takes the endpoint URL as a parameter.
 */

 TimeMapItem.prototype.changeTheme = function(newTheme, suppressLayout) {
    var item = this,
        type = item.getType(),
        event = item.event,
        placemark = item.placemark,
        i;
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
        if (type == 'array') {
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

angular.module('eventsApp')
    .service('timemapService', function($q, eventService) {

        function createEventObject(e) {
            var entry = {
                start: e.start_time,
                title: e.length < 20 ? e.description : e.description.substr(0, 20) + '...',
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
            oldTheme = _.clone(event.opts.theme);
            if (oldEvent) {
                oldEvent.changeTheme(oldTheme);
            }
            event.changeTheme('green');
            oldEvent = event;
            if (callback) {
                callback(event);
            }
        };

        this.createTimemap = function(start, end, infoWindowCallback) {
            return (function() {
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
                $q.reject(data);
            });
        };
    });

