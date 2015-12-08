'use strict';

angular.module('eventsApp')
/*
 * Service for providing SPARQL query paging.
 */
.factory('PagerService', function($q) {
    return function(sparqlQry, pageSize, getResults) {
        var countify = function(sparqlQry) {
            return sparqlQry.replace(/\bselect\b.+?(where)?\W+?\{/i,
                'SELECT (COUNT(DISTINCT ?id) AS ?count) WHERE {');
        };

        var pagify = function(sparqlQry, page, pageSize) {
            return sparqlQry + ' LIMIT ' + pageSize + ' OFFSET ' + ((page - 1) * pageSize);
        };

        var countQry = countify(sparqlQry);
        var count;

        this.getTotalCount = function() {
            if (count) {
                return $q.when(count);
            }
            return getResults(countQry, true).then(function(results) {
                count = parseInt(results[0].count.value);
                return count;
            });
        };

        this.getPage = function(pageNo) {
            return getResults(pagify(sparqlQry, pageNo, pageSize));
        };
    };
})
/*
 * Service for querying a SPARQL endpoint.
 * Takes the endpoint URL as a parameter.
 */
.factory('SparqlService', function($http, $q) {
    return function(endpointUrl) {

        var executeQuery = function(sparqlQry) {
            return $http.get(endpointUrl + '?query=' + encodeURIComponent(sparqlQry) + '&format=json');
        };

        return {
            getObjects: function(sparqlQry) {
                // Query the endpoint and return a promise of the bindings.
                return executeQuery(sparqlQry).then(function(response) {
                    return response.data.results.bindings;
                }, function(response) {
                    return $q.reject(response.data);
                });
            }
        };
    };
})
.factory('AdvancedSparqlService', function($http, $q, SparqlService, PagerService) {
    return function(endpointUrl, mapper) {
        var endpoint = new SparqlService(endpointUrl);

        var getResults = function(sparqlQry, raw) {
            var promise = endpoint.getObjects(sparqlQry);
            if (raw) {
                return promise;
            }
            return promise.then(function(data) {
                return mapper.makeObjectList(data);
            });
        };

        return {
            getObjects: function(sparqlQry, pageSize) {
                // If pageSize is defined, return (a promise of) a PagerService object, otherwise
                // query the endpoint and return the results as a promise.
                if (pageSize) {
                    return new PagerService(sparqlQry, pageSize, getResults);
                }
                // Query the endpoint.
                return getResults(sparqlQry);
            }
        };
    };
});
