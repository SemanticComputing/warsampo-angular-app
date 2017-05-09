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
            cemeteryService.getSingleCemeteryById($routeParams.uri)
            .then(function(cemetery) {
                vm.cemetery = cemetery;
                return cemeteryService.fetchRelated(vm.cemetery);
            })
            .then(function(cemetery) {
                vm.places = getDeathPlaces(cemetery);
                vm.persons = addRankAndUnitLabel(cemetery.buriedPersons);
                vm.isLoadingCemetery = false;
                return cemeteryService.getCemeteriesByPlaceId(vm.cemetery.place_id,
                    Settings.pageSize, vm.cemetery.id);
            })
            .then(function(cemeteries) {
                vm.relatedCemeteriesByPlace = cemeteries;
                vm.isLoadingLinks = false;
            })
            .catch(function(error) {
                console.log(error);
                vm.isLoadingCemetery = false;
                vm.isLoadingLinks = false;
            });
        }
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
                          link: person.id,
                          lat: place.point.lat,
                          lon: place.point.lon,
                      });
                  }
              });
          });
          return places;
      }

      function addRankAndUnitLabel(buriedPersons) {
          buriedPersons.forEach(function(person) {
              person.rank_label = person.rank[0].getLabel();

              /*  TODO: some units have two preflabels, e.g.
                  http://ldf.fi/warsa/actors/actor_1754
                  http://ldf.fi/warsa/actors/actor_1293
              */
              if (person.unit.length > 0) {
                  person.unit_label = person.unit[0].label;
              }

          });
          return buriedPersons;
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
