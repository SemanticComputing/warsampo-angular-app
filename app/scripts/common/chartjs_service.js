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

            var sliceVisibilityThreshold = 0.01;

            if (prop == 'unit_label' || prop == 'rank_label') {
                var others = {  value: 'Other',
                              count: 0,
                              uri: '',
                              instances: [],
                };
                var modified = [];
                for (var i = 0; i < distribution.length; i++) {
                    var portion = distribution[i].count / persons.length;
                    if (portion < sliceVisibilityThreshold) {
                        others.count += distribution[i].count;
                        var instances = distribution[i].instances;
                        instances.forEach(function(instance) {
                            instance.groupLabel = distribution[i].value;
                            instance.groupUri = distribution[i].uri;
                        });
                        others.instances = others.instances.concat(instances);
                    } else {
                        modified.push(distribution[i]);
                    }
                }
                distribution = modified;
            }

            if (sorted) {
                distribution = distribution.sort(function(a, b){ return b.instances.length-a.count });
            }

            if (prop == 'unit_label' || prop == 'rank_label') {
                distribution.push(others);
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
                            groups: [],
                            total: 0
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
            //console.log(data.length);
            //var counter = 0;

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
            // if (prop == 'unit_label') {
            //     Object.keys(res).forEach(function(key) {
            //           counter += res[key].count;
            //     });
            //
            // }
            return _.values(res);
        }




    });
})();
