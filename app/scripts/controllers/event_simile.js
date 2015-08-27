'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('SimileMapCtrl', function ($scope, eventService, photoService) {
      $scope.images = undefined;
      $scope.photoDaysBefore = 1;
      $scope.photoDaysAfter = 4;
      $scope.photoPlace = true;

      var infoHtml = "<div><h3>{0}</h3><p>{1}</p></div>";

      function changeDateAndFormat(date, days) {
          var d = new Date(date);
          d.setDate(d.getDate() + days);
          return d.toISOString().slice(0, 10);
      }

      var getImageUrls = function(item) {
          $scope.images = [];
          var place_ids;
          if ($scope.photoPlace) {
            place_ids = item.opts.place_uri;
          }

          $scope.isLoadingImages = true;
          photoService.getPhotosByPlaceAndTimeSpan(place_ids, 
                changeDateAndFormat(item.getStart(), -$scope.photoDaysBefore), 
                changeDateAndFormat(item.getEnd(), $scope.photoDaysAfter))
                .then(function(imgs) {
                    $scope.isLoadingImages = false;
                      imgs.forEach(function(img) {
                          $scope.images.push(img);
                      });
                });
      };

      $scope.fetchImages = function() {
          if ($scope.selected) {
            getImageUrls($scope.selected);
          }
      };


      $scope.createTimeMap = function(start, end) {
          (function() {
              return (start && end) ? eventService.getEventsByTimeSpan(start, end) : eventService.getAllEvents();
          })().then(function(data) {
                var res = [];
                data.forEach(function(e) {
                    var entry = {
                        start: e.start_time,
                        title: e.length < 20 ? e.description : e.description.substr(0, 20) + '...',
                        options: {
                            infoHtml: infoHtml.format(eventService.createTitle(e), e.description),
                            place_uri: e.place_id,
                        }
                    };
                    if (e.start_time !== e.end_time) {
                        entry.end = e.end_time;
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

                    res.push(entry);
                });
                var tm;
                var ib;
                tm = TimeMap.init({
                    mapId: "map",               // Id of map div element (required)
                    timelineId: "timeline",     // Id of timeline div element (required)
                    options: {
                        eventIconPath: "vendor/timemap/images/",
                        openInfoWindow: function() {
                            // call some custom function, passing the item
                            if (ib) {
                                ib.close();
                            }
                            $scope.selected = this;
                            $scope.fetchImages();
                            var opts = {
                                content: this.opts.infoHtml,
                                isHidden: false,
                                pane: 'floatPane',
                                boxStyle: {
                                    background: "rgb(255, 255, 255)",
                                    width: "280px"
                                },
                                infoBoxClearance: new google.maps.Size(1, 1)
                            };
                            ib = new InfoBox(opts);
                            var map = this.map.maps.googlev3; 
                            var mark = this.getNativePlacemark();
                            if (mark) {
                                ib.open(map, mark);
                            } else {
                                ib.position_ = map.getCenter();
                                ib.open(map);
                            }
                            //TimeMapItem.openInfoWindowBasic.call(this);
                        }
                    },
                    datasets: [
                    {
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
            }, function(data) {
                $scope.error = data;
            });
      };

      $scope.showWinterWar = function() {
        $scope.createTimeMap('1939-01-01', '1940-12-31');
      };
      $scope.showContinuationWar = function() {
        $scope.createTimeMap('1941-06-01', '1944-12-31');
      };

      $scope.showWinterWar();

  });
