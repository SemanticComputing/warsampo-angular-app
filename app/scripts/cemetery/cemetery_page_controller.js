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
    function CemeteryPageController($routeParams, $scope, $timeout, $sce, $uibModal, $q, _, cemeteryService, chartjsService, Settings) {

          var vm = this;

          init();

          function init() {
              if (!$routeParams.uri) {
                  return;
              }
              vm.isLoadingCemetery = true;
              vm.isLoadingLinks = true;
              vm.hasVisualizableData = false;
              vm.hasDeathPlaces = false;
              self.err = undefined;
              vm.chartObjs = {};
              vm.chartOptions = {};

              setChartOptions(['unitChart', 'rankChart', 'ageChart', 'wayChart']);

              cemeteryService.getSingleCemeteryById($routeParams.uri)
              .then(function(cemetery) {
                  vm.cemetery = cemetery;
                  vm.casualtiesLink = '/' + $routeParams.lang  +'/casualties/?facets={"cemetery":{"value":"<'+ cemetery.id +'>","constraint":" ?id <http://ldf.fi/schema/narc-menehtyneet1939-45/hautausmaa> <'+ cemetery.id +'> . "}}';
                  return cemeteryService.fetchRelated(vm.cemetery);
              })
              .then(function(cemetery) {
                  var deathPlaces = getDeathPlaces(cemetery);
                  if (deathPlaces.length > 0) {
                      vm.places = deathPlaces;
                      vm.hasDeathPlaces = true;
                  }

                  if (cemetery.buriedPersons.length > 10) {
                      vm.hasPersons = true;
                      vm.hasVisualizableData = true;

                      // Calculate some extra info for visualizations
                      vm.buriedPersons = addRankAndUnitLabel(cemetery.buriedPersons);
                      vm.buriedPersons.forEach(function(person) {
                          person.age = getAge(person.cas_date_of_birth, person.cas_date_of_death);
                      });

                      vm.unitChart = chartjsService.createPersonDistribution(vm.buriedPersons, 'unit_label', 'unit_id_picked', true, $routeParams.lang);
                      vm.rankChart = chartjsService.createPersonDistribution(vm.buriedPersons, 'rank_label', 'rank_id', true, $routeParams.lang);
                      vm.ageChart = chartjsService.createPersonDistribution(vm.buriedPersons, 'age', '', false, $routeParams.lang);
                      vm.wayChart = chartjsService.createPersonDistribution(vm.buriedPersons, 'way_to_die', '', true, $routeParams.lang);
                  }
                  else {
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

        // https://stackoverflow.com/questions/41545742/getting-access-to-already-created-chart-js-chart
        $scope.$on('chart-create', function (event, chart) {
            vm.chartObjs[chart.chart.canvas.id] = chart;
            vm[chart.options.title.text].legendHtml = $sce.trustAsHtml(chart.generateLegend());
        });

        function setChartOptions(chartTitles) {
          chartTitles.forEach(function(chartTitle) {
            vm.chartOptions[chartTitle] = {
                title: {
                  text: chartTitle
                },
                legendCallback: function(chart) {
                    var text = [];
                    text.push('<ul class="chartjs-legend-list">');
                    var data = chart.data;
                    var datasets = data.datasets;
                    var labels = data.labels;
                    if (datasets.length) {
                        for (var i = 0; i < datasets[0].data.length; ++i) {
                            text.push('<li><div class="circle" style="background-color:' + chart.data.datasets[0].backgroundColor[i] + '"></div>');
                            if (labels[i]) {
                                switch (chartTitle) {
                                  case 'unitChart':
                                      text.push('<a href="/units/page?uri=' + vm[chartTitle].uris[i] + '">' + chart.data.labels[i] + '</a>');
                                      break;
                                  case 'rankChart':
                                      text.push('<a href="/ranks/page?uri=' + vm[chartTitle].uris[i] + '">' + chart.data.labels[i] + '</a>');
                                      break;
                                  case 'wayChart':
                                      text.push(chart.data.labels[i]);
                                      break;
                                }

                            }
                            text.push('</li>');
                        }
                    }
                    text.push('</ul>');
                    return text.join('');
                },
                onClick : function(event, elements) {
                    var i = elements[0]._index;
                    var persons = vm[chartTitle].groups[i];
                    var group = vm[chartTitle].labels[i];
                    var groupId = vm[chartTitle].uris[i];
                    if (chartTitle == 'ageChart') {
                      // TODO: translation
                      //group =  'CEMETERY_DEMO.AGE_AT_DEATH' + ': ' + group;
                      group =  'Kuolinikä: ' + group;
                    }
                    openModal(vm.cemetery.label, group, groupId, persons);
                },
                tooltips: {
                    callbacks: {
                      // http://blog.cryst.co.uk/2016/06/03/adding-percentages-chart-js-pie-chart-tooltips/
                      label: function(tooltipItem, data) {
                        var allData = data.datasets[tooltipItem.datasetIndex].data;
                        console.log(allData);
                        var tooltipLabel = data.labels[tooltipItem.index];
                        var tooltipData = allData[tooltipItem.index];
                        var total = 0;
                        for (var i in allData) {
                          total += allData[i];
                        }
                        console.log(total);
                        var tooltipPercentage = Math.round((tooltipData / total) * 100);
                        return tooltipLabel + ': ' + tooltipData + ' (' + tooltipPercentage + '%)';
                      }
                    },
                    displayColors: false,
                },
                legend: {
                    display: false
                },
            };

            if (chartTitle == 'ageChart') {
                vm.chartOptions[chartTitle]['scales'] = {
                    xAxes: [{
                      ticks: {
                          maxRotation: 0,
                          autoSkipPadding: 3
                      }
                    }],
                    options: {
                        maintainAspectRatio: false,
                    }
                }
            }


          });
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

        function getAge(birthDateString, deathDateString) {
            var deatDate = new Date(deathDateString);
            var birthDate = new Date(birthDateString);
            var age = deatDate.getFullYear() - birthDate.getFullYear();
            var m = deatDate.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && deatDate.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        }

        function openModal(cemetery, group, groupId, persons) {
            $uibModal.open({
                component: 'personGroupModal',
                size: 'lg',
                resolve: {
                    cemetery: function() { return cemetery; },
                    group: function() { return group; },
                    groupId: function() { return groupId; },
                    persons: function() { return persons; }
                }
            });
        }

    }
})();
