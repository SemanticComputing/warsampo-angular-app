(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .service('chartjsService', function(google) {

        var self = this;

        self.createPersonDistribution = createPersonDistribution;
        self.createBarChart = createBarChart;

        function createBarChart(points) {
            points.sort(function(a, b){ return b.value-a.value });
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

        function createPersonDistribution(persons, prop, uriProp, sorted, lang) {

            var distribution = countByProperty(persons, prop, uriProp, sorted);
            if (sorted) {
              distribution = distribution.sort(function(a, b){ return b.instances.length-a.count });
            }

            // Fill the missing gaps for age chart
            if (prop == 'age') {
                var ageDistribution = [];
                var j = 0;
                for (var i = 0; i < 81; i++ ) {
                    if (j < distribution.length && distribution[j].value == i) {
                        ageDistribution.push(distribution[j]);
                        j = j+1;
                    }
                    else {
                        ageDistribution.push({  value: i,
                                                count: 0,
                                                uri: '',
                                                instances: [],
                                             });
                    }
                }
                distribution = ageDistribution;
            }

            var chart = {   data: [],
                            labels: [],
                            uris: [],
                            groups: []
                        };
            distribution.forEach(function(item) {
                  if (prop == 'way_to_die') {
                      if (lang == 'fi') {
                          chart.labels.push(item.value[0]);
                      } else {
                          chart.labels.push(item.value[1]);
                      }                  
                  } else {
                      chart.labels.push(item.value);
                  }
                  chart.data.push(item.count);
                  chart.uris.push(item.uri);
                  chart.groups.push(item.instances);
            });
            return chart;

        }

        function countByProperty(data, prop, uriProp) {
            //console.log(data);
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
