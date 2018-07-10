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
    function CemeteryPageController($scope, $transition$, $sce, $uibModal, $q, _, cemeteryService,
                chartjsService, Settings, baseService, uri) {

          var vm = this;

          init();

          function init() {
              if (!uri) {
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

              var lang = $transition$.params().lang;

              cemeteryService.getSingleCemeteryById(uri)
              .then(function(cemetery) {
                  vm.cemetery = cemetery;
                  vm.casualtiesLink = '/' + lang  +'/casualties/?facets={"cemetery":{"value":"<'+ cemetery.id +'>","constraint":" ?id <http://ldf.fi/schema/warsa/buried_in> <'+ cemetery.id +'> . "}}';
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

                      vm.unitChart = chartjsService.createPersonDistribution(vm.buriedPersons, 'unit_label', 'unit_id_picked', true, lang);
                      vm.rankChart = chartjsService.createPersonDistribution(vm.buriedPersons, 'rank_label', 'rank_id', true, lang);
                      vm.ageChart = chartjsService.createPersonDistribution(vm.buriedPersons, 'age', '', false, lang);
                      vm.wayChart = chartjsService.createPersonDistribution(vm.buriedPersons, 'way_to_die', '', true, lang);
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
                                var createLink = labels[i] !== 'Muu' && labels[i] !== 'Other'? true : false;
                                switch (chartTitle) {
                                  case 'unitChart':
                                      if (createLink) {
                                          text.push('<a href="/units/page/' + baseService.getIdFromUri(vm[chartTitle].uris[i]) + '">' + labels[i] + '</a>');
                                      } else {
                                          text.push('<span>' + labels[i] + '</span>');
                                      }
                                      break;
                                  case 'rankChart':
                                      if (createLink) {
                                          text.push('<a href="/ranks/page/' + baseService.getIdFromUri(vm[chartTitle].uris[i]) + '">' + labels[i] + '</a>');
                                      } else {
                                          text.push('<span>' + labels[i] + '</span>');
                                      }
                                      break;
                                  case 'wayChart':
                                      text.push(labels[i]);
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
                    openModal(vm.cemetery.label, group, groupId, persons, chartTitle);
                },
                tooltips: {
                    callbacks: {
                      // http://blog.cryst.co.uk/2016/06/03/adding-percentages-chart-js-pie-chart-tooltips/
                      label: function(tooltipItem, data) {
                        var allData = data.datasets[tooltipItem.datasetIndex].data;
                        var tooltipLabel = data.labels[tooltipItem.index];
                        var tooltipData = allData[tooltipItem.index];
                        var total = 0;
                        for (var i in allData) {
                          total += allData[i];
                        }
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

                // if (person.id == 'http://ldf.fi/warsa/actors/person_p689') {
                //     console.log(person);
                //     console.log(person.rank);
                //     console.log(person.rank[0].label);
                // }


                //Persons from casulties have only one rank
                if (person.rank && person.rank.length > 0) {
                  person.rank_label = person.rank[0].label;
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
                            timeSpanString: event.timeSpanString,
                            wayToDie: event.way_to_die
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

        function openModal(cemetery, group, groupId, persons, chartTitle) {
            $uibModal.open({
                component: 'personGroupModal',
                size: 'lg',
                resolve: {
                    cemetery: function() { return cemetery; },
                    group: function() { return group; },
                    groupId: function() { return groupId; },
                    persons: function() { return persons; },
                    chartTitle: function() { return chartTitle}
                }
            });
        }

    }
})();
