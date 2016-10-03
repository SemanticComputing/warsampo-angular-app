(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('eventsApp')

    /*
     * Photo facet service
     */
    .service('photoFacetService', photoFacetService);

    /* @ngInject */
    function photoFacetService($q, $translate, _, photoRepository, facetSelectionFormatter,
            SPARQL_ENDPOINT_URL, PNR_SERVICE_URI, PHOTO_PAGE_SIZE) {

        this.getResults = getResults;
        this.getFacets = getFacets;
        this.getFacetOptions = getFacetOptions;

        var facets = {
            '<http://ldf.fi/kuvanottoaika>' : {
                name: 'PHOTO_DEMO.PHOTO_TAKEN_BETWEEN',
                type: 'timespan',
                start: '<http://purl.org/dc/terms/created>',
                end: '<http://purl.org/dc/terms/created>',
                min: '1939-10-01',
                max: '1945-12-31',
                enabled: true
            },
            '<http://purl.org/dc/terms/description>': {
                name: 'PHOTO_DEMO.DESCRIPTION',
                type: 'text',
                enabled: true
            },
            '<http://purl.org/dc/terms/spatial>': {
                name: 'PHOTO_DEMO.PLACE',
                service: PNR_SERVICE_URI,
                enabled: true
            },
            '<http://purl.org/dc/terms/subject>': {
                name: 'PHOTO_DEMO.PERSON',
                enabled: true
            },
            '<http://ldf.fi/warsa/photographs/unit>': { name: 'PHOTO_DEMO.UNIT' },
            '<http://purl.org/dc/terms/creator>': { name: 'PHOTO_DEMO.PHOTOGRAPHER' },
            '<http://ldf.fi/warsa/photographs/theme>': { name: 'PHOTO_DEMO.THEME_CODE' }
        };

        var facetOptions = {
            endpointUrl: SPARQL_ENDPOINT_URL,
            graph : '<http://ldf.fi/warsa/photographs>',
            rdfClass: '<http://ldf.fi/warsa/photographs/Photograph>',
            preferredLang : 'fi'
        };

        var fetchOptions = { pageSize: PHOTO_PAGE_SIZE };

        function getResults(facetSelections) {
            var selections = facetSelectionFormatter.parseFacetSelections(facets, facetSelections);
            return photoRepository.getByFacetSelections(selections, fetchOptions);
        }

        function getFacets() {
            return $translate(_.map(facets, 'name'))
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
