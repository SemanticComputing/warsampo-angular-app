(function() {
    'use strict';

    angular.module('eventsApp')
    .factory('facetService', FacetService);

    var facetSparql = `
    SELECT (count(DISTINCT ?s) as ?cnt) ?facet_text ?o WHERE {
        VALUES ?id {
            {0}
        }
        GRAPH {1} {
            ?s ?id ?value .
            {2}
        }
        OPTIONAL {
            ?value skos:prefLabel ?lbl .
        }
        {3}
        BIND(COALESCE(?lbl, ?value) as ?facet_text)
    } GROUP BY ?id ?facet_text ?value`;

    /* @ngInject */
    function FacetService(_, SparqlService) {
        return create;

        function create(options) {
            var endpoint = new SparqlService(endpointUrl);

            var config = {
                lang: '',
                classFilter: '',
            };

            angular.extend(config, options);

            config.facetFilter = getFacetFilters(facets);

            var facets = _.pluck(config.facets, 'uri');

            var qry = facetSparql.format(
                facets,
                config.graph,
                config.facetFilter,
                config.lang,
            );

            function update(facet, uri) {
            }
        }

        function getFacetFilters(facets) {
            if (!facets) {
                return '';
            }
            var s = '';
            var counter = 0;
            facets.forEach(function(facet) {
                s = s + ' ?s {0} ?f{1} . '.format(s, counter++);
            });
            return s;
        }
    }
})();
