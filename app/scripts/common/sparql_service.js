'use strict';

/*
 * Service for querying a SPARQL endpoint.
 * Takes the endpoint URL as a parameter.
 */
angular.module('eventsApp')
    .factory('SparqlService', function($http, $q) {
        return function(endpointUrl) {

            var executeQuery = function(sparqlQry) {
                return $http.get(endpointUrl + '?query=' + encodeURIComponent(sparqlQry) + '&format=json');
            };

            return {
                getObjects: function(sparqlQry) {
                    // Query for triples and call the callback function with the results
                    return executeQuery(sparqlQry).then(function(response) {
                        return response.data.results.bindings;
                    }, function(response) {
                        return $q.reject(response.data);
                    });
                }
            };
        };
});

