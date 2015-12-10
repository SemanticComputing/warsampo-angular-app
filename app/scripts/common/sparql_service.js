'use strict';

angular.module('eventsApp')
/*
 * Service for providing SPARQL query paging.
 * sparqlQry is the SPARQL query for the whole data that should be paged.
 * pageSize is the size of one page.
 * getResults is the function that is used for querying for results.
 * Paging is 0-based.
 * Will fetch multiple pages per query and cache them.
 */
.factory('PagerService', function($q, Settings) {
    return function(sparqlQry, pageSize, getResults) {

        var self = this;

        // The total number of items.
        var count;
        // The number of the last page.
        var maxPage = Infinity;
        // Cached pages.
        var pages = [];
        // How many pages to get with one query.
        self.pagesPerQuery = Settings.pagesFetchedPerQuery;

        var countify = function(sparqlQry) {
            // Form a query that counts the total number of items returned
            // by the query.
            return sparqlQry.replace(/\bselect\b.+?(where)?\W+?\{/i,
                'SELECT (COUNT(DISTINCT ?id) AS ?count) WHERE {');
        };

        var pagify = function(sparqlQry, page, pageSize) {
            // Form the query for the given page.
            return sparqlQry + ' LIMIT ' + pageSize * self.pagesPerQuery + ' OFFSET ' + (page * pageSize);
        };

        var countQry = countify(sparqlQry);

        self.getTotalCount = function() {
            // Get the total number of items that the original query returns.
            // Returns a promise.

            // Get cached count if available.
            if (count) {
                return $q.when(count);
            }
            return getResults(countQry, true).then(function(results) {
                // Cache the count.
                count = parseInt(results[0].count.value);
                maxPage = Math.ceil(count / pageSize) - 1;
                return count;
            });
        };

        var getPageWindowStart = function(pageNo) {
            // Get the page number of the first page to fetch.

            if (pageNo <= 0) {
                // First page.
                return 0;
            }
            if (pageNo >= maxPage) {
                // Last page -> window ends on last page.
                return Math.max(pageNo - self.pagesPerQuery + 1, 0);
            }
            var minMin = pageNo < self.pagesPerQuery ? 0 : pageNo - self.pagesPerQuery;
            var maxMax = pageNo + self.pagesPerQuery > maxPage ? maxPage : pageNo + self.pagesPerQuery;
            var min, max;
            for (min = minMin; min < pageNo; min++) {
                // Get the lowest non-cached page within the extended window.
                if (!pages[min]) {
                    break;
                }
            }
            if (min === pageNo) {
                // No non-cached pages before the requested page within the extended window.
                return pageNo;
            }
            for (max = maxMax; max > pageNo; max--) {
                // Get the highest non-cached page within the extended window.
                if (!pages[max]) {
                    break;
                }
            }
            if (minMin === min && maxMax === max) {
                // No cached pages near the requested page
                // -> requested page in the center of the window
                return min + Math.ceil(pageSize / 2);
            }
            if (max < maxMax) {
                // There are some cached pages toward the end of the extended window
                // -> window ends at the last non-cached page
                return Math.max(max - pageSize + 1, 0);
            }
            // Otherwise window starts from the lowest non-cached page 
            // within the extended window.
            return min;
        };

        self.getPage = function(pageNo) {
            // Get a specific "page" of data.

            // Get cached page if available.
            if (pages[pageNo]) {
                return pages[pageNo].promise;
            }
            // Get the page window for the query (i.e. query for surrounding
            // pages as well according to self.pagesPerQuery).
            var start = getPageWindowStart(pageNo);
            // Assign a promise to each page within the window as all of those
            // will be fetched.
            for (var i = start; i < start + self.pagesPerQuery && i <= maxPage; i++) {
                if (!pages[i]) {
                    pages[i] = $q.defer();
                }
            }
            // Query for the pages.
            return getResults(pagify(sparqlQry, start, pageSize))
            .then(function(results) {
                var chunks = _.chunk(results, self.pagesPerQuery);
                chunks.forEach(function(page) {
                    // Resolve each page promise.
                    pages[start].resolve(page);
                    start++;
                });
                // Return (the promise of) the requested page.
                return pages[pageNo].promise;
            });
        };

        self.getAll = function() {
            // Get all of the data.
            return getResults(sparqlQry);
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
            return $http.get(endpointUrl + '?query=' + encodeURIComponent(sparqlQry) + '&format=json',
                { cache: true });
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
 * The mapper should provide 'makeObjectList' and 'makeObjectListNoGrouping'
 * functions that take the SPARQL results as parameter and return the mapped objects.
 * */
.factory('AdvancedSparqlService', function($http, $q, SparqlService, PagerService) {
    return function(endpointUrl, mapper) {
        var endpoint = new SparqlService(endpointUrl);

        var getResultsWithGrouping = function(sparqlQry, raw) {
            var promise = endpoint.getObjects(sparqlQry);
            if (raw) {
                return promise;
            }
            return promise.then(function(data) {
                return mapper.makeObjectList(data);
            });
        };

        var getResultsNoGrouping = function(sparqlQry, raw) {
            var promise = endpoint.getObjects(sparqlQry);
            if (raw) {
                return promise;
            }
            return promise.then(function(data) {
                return mapper.makeObjectListNoGrouping(data);
            });
        };

        return {
            getObjects: function(sparqlQry, pageSize) {
                // Get the results as objects.
                // If pageSize is defined, return a (promise of a) PagerService object, otherwise
                // query the endpoint and return the results as a promise.
                if (pageSize) {
                    return $q.when(new PagerService(sparqlQry, pageSize, getResultsWithGrouping));
                }
                // Query the endpoint.
                return getResultsWithGrouping(sparqlQry);
            },
            getObjectsNoGrouping: function(sparqlQry, pageSize) {
                // Get the results as objects but call 'makeObjectListNoGrouping' instead
                // (i.e. treat each result as a separate object and don't group by id).
                // If pageSize is defined, return a (promise of a) PagerService object, otherwise
                // query the endpoint and return the results as a promise.
                if (pageSize) {
                    return $q.when(new PagerService(sparqlQry, pageSize, getResultsNoGrouping));
                }
                // Query the endpoint.
                return getResultsNoGrouping(sparqlQry);
            }
        };
    };
});
