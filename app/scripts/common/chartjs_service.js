(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .service('chartjsService', function(google) {

        var self = this;

        self.createPersonPieChart = createPersonPieChart;
        self.createBarChart = createBarChart;

        function createBarChart(points) {
            points.sort(function(a, b){ return b.value-a.value });
            console.log(points);
            var chart = {   data: [],
                            labels: [],
                        };
            points.forEach(function(point) {
                if (point.value) {
                  chart.data.push(point.value);
                  chart.labels.push(point.label);
                }

            });
            return chart;
        }

        function createPersonPieChart(persons, prop, uriProp) {
            var distribution = countByProperty(persons, prop, uriProp);
            var chart = {   data: [],
                            labels: [],
                            uris: [],
                            groups: []
                        };
            distribution.forEach(function(item) {
                  chart.data.push(item.count);
                  chart.labels.push(item.value);
                  chart.uris.push(item.uri);
                  chart.groups.push(item.instances);
            });
            return chart;
        }

        function countByProperty(data, prop, uriProp) {
           return countProperties(data, prop, uriProp)
           .sort(function(a, b){ return b.instances.length-a.count });
        }

        function countProperties(data, prop, uriProp) {
            var res = {};
            data.forEach(function(item) {
                if (item.hasOwnProperty(prop)) {
                    var value = item[prop];
                    if (res.hasOwnProperty(value)) {
                      res[value].count += 1;
                      res[value].instances.push({ label: item.label, uri: item.id });
                    } else {
                        res[value] =  { uri: item[uriProp],
                                        count : 1,
                                        instances: [ { label: item.label, uri: item.id } ],
                                        value: value
                                      }
                    }
                  }
            });
            return _.values(res);
        }


    });
})();
