(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('eventsApp')

    /*
     * Photo facet service
     */
    .service( 'photoFacetService', photoFacetService );

    /* @ngInject */
    function photoFacetService($q, $translate, _, photoRepository,
            facetSelectionFormatter, SPARQL_ENDPOINT_URL, PHOTO_PAGE_SIZE) {

        var facets = {
            '<http://ldf.fi/kuvanottoaika>' : {
                name: 'PHOTO_TAKEN_BETWEEN',
                type: 'timespan',
                start: '<http://purl.org/dc/terms/created>',
                end: '<http://purl.org/dc/terms/created>',
                min: '1939-10-01',
                max: '1945-12-31',
                enabled: true
            },
            '<http://purl.org/dc/terms/description>': {
                name: 'DESCRIPTION',
                type: 'text',
                enabled: true
            },
            '<http://purl.org/dc/terms/spatial>': {
                name: 'PLACE',
                service: '<http://ldf.fi/pnr/sparql>',
                enabled: true
            },
            '<http://purl.org/dc/terms/subject>': {
                name: 'PERSON',
                enabled: true
            },
            '<http://purl.org/dc/terms/creator>': { name: 'PHOTOGRAPHER' }
        };

        var facetOptions = {
            endpointUrl: SPARQL_ENDPOINT_URL,
            graph : '<http://ldf.fi/warsa/photographs>',
            rdfClass: '<http://ldf.fi/warsa/photographs/Photograph>',
            preferredLang : 'fi'
        };

        var fetchOptions = { pageSize: PHOTO_PAGE_SIZE };

        this.getResults = getResults;
        this.getFacets = getFacets;
        this.getFacetOptions = getFacetOptions;

        function getResults(facetSelections) {
            var selections = facetSelectionFormatter.parseFacetSelections(facets, facetSelections);
            return photoRepository.getByFacetSelections(selections, fetchOptions);
        }

        function getFacets() {
            return $translate(['PHOTO_TAKEN_BETWEEN', 'DESCRIPTION', 'PLACE',
                    'PERSON', 'PHOTOGRAPHER'])
            .then(function(translations) {
                var facetClone = _.cloneDeep(facets);
                _.forOwn(facetClone, function(val) {
                    var trans = translations[val.name];
                    if (trans) {
                        val.name = trans;
                    }
                });
                return facetClone;
            });
        }

        function getFacetOptions() {
            return facetOptions;
        }
    }
})();
