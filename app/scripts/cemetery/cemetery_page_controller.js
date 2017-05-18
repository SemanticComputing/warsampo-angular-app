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
    function CemeteryPageController($routeParams, $q, _, cemeteryService, Settings) {

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
                 Always choose the first (higest in the hierarchy) for the
                 unit pie chart */
              if (person.unit && person.unit.length > 0) {
                person.unit_label = person.unit[0].getLabel();
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
})();
