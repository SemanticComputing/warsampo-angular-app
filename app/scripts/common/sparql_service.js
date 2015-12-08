'use strict';

angular.module('eventsApp')
/*
 * Service for providing SPARQL query paging.
 * sparqlQry is the SPARQL query for the whole data that should be paged.
 * pageSize is the size of one page.
 * getResults is the function that is used for querying for results.
 */
.factory('PagerService', function($q) {
    return function(sparqlQry, pageSize, getResults) {

        var countify = function(sparqlQry) {
            // Form a query that counts the total number of items returned
            // by the query.
            return sparqlQry.replace(/\bselect\b.+?(where)?\W+?\{/i,
                'SELECT (COUNT(DISTINCT ?id) AS ?count) WHERE {');
        };

        var pagify = function(sparqlQry, page, pageSize) {
            // Form the query for the given page.
            return sparqlQry + ' LIMIT ' + pageSize + ' OFFSET ' + ((page - 1) * pageSize);
        };

        var countQry = countify(sparqlQry);
        var count;

        this.getTotalCount = function() {
            // Get the total number of items that the original query returns.
            // Returns a promise.

            // Get cached count if available.
            if (count) {
                return $q.when(count);
            }
            return getResults(countQry, true).then(function(results) {
                // Cache the count.
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
/* Service for querying a SPARQL endpoint with paging support.
 * Takes the endpoint URL and a mapper object as parameters.
 * The mapper is an object that maps the SPARQL results to objects.
 * The mapper should provide a 'makeObjectList' function that takes the SPARQL
 * results as parameter and returns the mapped objects.
 * */
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
                // If pageSize is defined, return a PagerService object, otherwise
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
