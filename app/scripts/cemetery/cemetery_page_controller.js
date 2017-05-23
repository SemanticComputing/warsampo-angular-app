(function() {
    'use strict';

    /**
    * @ngdoc controller
    * @name eventsApp.controller:CemeteryPageController
    * @description
    * # CemeteryPageController
    * Cemetery page controller.
    */
    angular.module('eventsApp')
    .controller('CemeteryPageController', CemeteryPageController);

    /* @ngInject */
    function CemeteryPageController($routeParams, $scope, $timeout, $sce, $q, _, cemeteryService, Settings) {

        var vm = this;

        init();

        function init() {
            if (!$routeParams.uri) {
                return;
            }
            vm.isLoadingCemetery = true;
            vm.isLoadingLinks = true;
            self.err = undefined;
            cemeteryService.getSingleCemeteryById($routeParams.uri)
            .then(function(cemetery) {
                vm.cemetery = cemetery;
                return cemeteryService.fetchRelated(vm.cemetery);
            })
            .then(function(cemetery) {
                vm.places = getDeathPlaces(cemetery);
                if (cemetery.buriedPersons.length > 10) {
                    vm.buriedPersons = addRankAndUnitLabel(cemetery.buriedPersons);
                    var distribution = countByProperty(vm.buriedPersons, 'unit_label', 'unit_id_picked');
                    vm.labels = [];
                    vm.data = [];
                    vm.uris = [];
                    distribution.forEach(function(item) {
                          vm.labels.push(item.value);
                          vm.data.push(item.count);
                          vm.uris.push(item.uri);
                    });
                    vm.options = {
                        legend: {
                            display: false,
                            labels: {
                                generateLabels: function(chart){
                                    var text = [];
                                    text.push('<ul class="chartjs-legend-list">');
                                    for (var i = 0; i < chart.data.datasets[0].data.length; i++) {
                                      //console.log(chart.data.datasets[0].backgroundColor[i]);
                                      text.push('<li><div class="circle" style="background-color:' + chart.data.datasets[0].backgroundColor[i] + '">');
                                      text.push('</div>');
                                      if (chart.data.labels[i]) {
                                        text.push(chart.data.labels[i]);
                                      }
                                      text.push('</li>');
                                    }
                                    text.push('</ul>');
                                    $timeout(function() {
                                      $scope.$apply(function() {
                                          vm.legendHtml = $sce.trustAsHtml(text.join(""));
                                      });
                                    });

                                }
                            }
                        },
                    };

                } else {
                    vm.buriedPersons = undefined;
                }
                vm.isLoadingCemetery = false;
                return cemeteryService.getCemeteriesByPlaceId(vm.cemetery.place_id,
                    Settings.pageSize, vm.cemetery.id);
            })
            .then(function(cemeteries) {
                vm.relatedCemeteriesByPlace = cemeteries;
                vm.isLoadingLinks = false;
            })
            .catch(function(data) {
                data = data || 'Unknown error';
                self.err = data.message || data;
                vm.isLoadingCemetery = false;
                vm.isLoadingLinks = false;
            });
        }
      }

      function addRankAndUnitLabel(buriedPersons) {
          buriedPersons.forEach(function(person) {

              // Persons from casulties have only one rank
              if (person.rank && person.rank.length > 0) {
                person.rank_label = person.rank[0].getLabel();
              }

              /* Persons from casulties may have 0, 1 or 2 units.
                 Always choose the first (highest in the hierarchy) for the
                 unit pie chart */
              if (person.unit && person.unit.length > 0) {
                person.unit_label = person.unit[0].getLabel();
                person.unit_id_picked = person.unit[0].id;
              }

          });
          return buriedPersons;
      }

      function getDeathPlaces(cemetery) {
          var places = [];
          cemetery.buriedPersons.forEach(function(person) {
              person.deathEvent.forEach(function(event) {
                  var place = pickPlaceByType(event.place);
                  if (place) {
                      places.push({
                          type: place.getTypeLabel(),
                          label: place.getLabel(),
                          description: event.getLabel(),
                          id: person.id,
                          lat: place.point.lat,
                          lon: place.point.lon,
                      });
                  }
              });
          });
          return places;
      }

      function pickPlaceByType(places) {
        var result;
        var municipality;
        _.forEach(_.castArray(places), function(place) {
            if (place.type_id === 'http://www.yso.fi/onto/suo/kunta') {
                if (place.point) {
                    municipality = place;
                }
            } else if (place.point) {
                result = place;
                return false;
            }
        });
        return result ? result : municipality;
      }

      function countByProperty(data, prop, uriProp) {
         return countProperties(data, prop, uriProp)
         .sort(function(a, b){ return b.count-a.count });
      }

      function countProperties(data, prop, uriProp) {
          var res = {};
          data.forEach(function(item) {
              if (item.hasOwnProperty(prop)) {
                  var value = item[prop];
                  if (res.hasOwnProperty(value)) {
                    res[value].count += 1;
                  } else {
                      res[value] =  { uri: item[uriProp],
                                      count: 1,
                                      value: value
                                    }
                  }
                }
          });
          return _.values(res);
      }

})();
