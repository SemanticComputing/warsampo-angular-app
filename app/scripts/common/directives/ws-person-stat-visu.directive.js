(function() {
    'use strict';

    angular.module('eventsApp')
    .directive('wsPersonStatVisu', function() {
        return {
            restrict:'E',
            scope: {
                persons: '<',
            },
            controller: PersonStatVisuContoller,
            controllerAs: 'vm',
            templateUrl: 'views/directive/ws-person-stat-visu.directive.html'
        };
    });


    /* @ngInject */
    function PersonStatVisuContoller($scope, $element) {
        var vm = this;

        $scope.$watch('persons', function(val) {
            if (!val || _.isArray(val) && !val.length) {
                return;
            }
            createVisualizations(val)
        });

        function createVisualizations(data) {
            google.charts.load('current', {packages: ['corechart']});
            google.charts.setOnLoadCallback(function () { drawPieChart(data, 'rank_label', '', 'rank_chart'); });
            google.charts.setOnLoadCallback(function () { drawPieChart(data, 'unit', '', 'unit_chart'); });

        }

        function drawPieChart(data, prop, label, target) {
            var arr = countByProperty(data, prop),
              data = google.visualization.arrayToDataTable( [[label, 'Lukumäärä']].concat(arr)),
              options = { title: label },
              chart = new google.visualization.PieChart(document.getElementById(target));
            chart.draw(data, options);
        }

        function countByProperty(data, prop) {
    	     return countProperties(data, prop)
    	     .sort(function(a, b){ return b[1]-a[1] });
        }

        function countProperties(data, prop) {
            var res = {};
            $.each(data, function( i, value ) {
              if (value.hasOwnProperty(prop)) {
                var y=value[prop];

                if (res.hasOwnProperty(y)) {
                  res[y] += 1;
                } else {
                  res[y] = 1;
                }
              }
            });
            return $.map( res, function( value, key ) {
              return [[key, value]];
            });
        }

    }

})();
