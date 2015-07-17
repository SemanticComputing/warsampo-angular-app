'use strict';

angular.module('eventsApp')
    .factory('SparqlService', function($http, $q) {

        return function(endpointUrl) {

            var executeQuery = function(sparqlQry) {
                return $http.get(endpointUrl + '?query=' + encodeURIComponent(sparqlQry) + '&format=json');
            };

            return {
                getObjects: function(sparqlQry, callback) {
                    // Query for triples and call the callback function with the results
                    return executeQuery(sparqlQry).then(function(response) {
                        var bindings = response.data.results.bindings;

                        if (callback) {
                            return callback(bindings);
                        }
                        return bindings;

                    }, function(response) {
                        return $q.reject(response.data);
                    });
                }
            };
        };
});

