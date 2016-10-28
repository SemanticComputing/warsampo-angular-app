(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('eventsApp')

    /*
     * Photo facet service
     */
    .service('photoFacetService', photoFacetService);

    /* @ngInject */
    function photoFacetService($q, $translate, _, photoRepository,
            SPARQL_ENDPOINT_URL, PNR_SERVICE_URI, PHOTO_PAGE_SIZE) {

        this.getResults = getResults;
        this.getFacets = getFacets;
        this.getFacetOptions = getFacetOptions;

        var facets = {
            taken: {
                facetId: 'taken',
                name: 'PHOTO_DEMO.PHOTO_TAKEN_BETWEEN',
                predicate: '<http://ldf.fi/kuvanottoaika>',
                start: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span>/<http://www.cidoc-crm.org/cidoc-crm/P82a_begin_of_the_begin>',
                end: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span>/<http://www.cidoc-crm.org/cidoc-crm/P82b_end_of_the_end>',
                min: '1939-10-01',
                max: '1945-12-31',
                enabled: true
            },
            description: {
                facetId: 'description',
                name: 'PHOTO_DEMO.DESCRIPTION',
                predicate: '<http://purl.org/dc/terms/description>',
                enabled: true
            },
            place: {
                facetId: 'spatial',
                name: 'PHOTO_DEMO.PLACE',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at>',
                services: [PNR_SERVICE_URI],
                enabled: true
            },
            person: {
                facetId: 'person',
                name: 'PHOTO_DEMO.PERSON',
                predicate:
                '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P11_had_participant>',
                specifier: '?value a/rdfs:subClassOf* <http://www.cidoc-crm.org/cidoc-crm/E21_Person> .',
                enabled: true
            },
            unit: {
                facetId: 'unit',
                name: 'PHOTO_DEMO.UNIT',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P11_had_participant>',
                specifier: '?value a <http://ldf.fi/warsa/actors/actor_types/MilitaryUnit> .'
            },
            photographer: {
                facetId: 'photographer',
                name: 'PHOTO_DEMO.PHOTOGRAPHER',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by>'
            },
            theme: {
                facetId: 'theme',
                name: 'PHOTO_DEMO.THEME_CODE',
                predicate: '<http://ldf.fi/warsa/photographs/theme>'
            }
        };

        var facetOptions = {
            endpointUrl: SPARQL_ENDPOINT_URL,
            rdfClass: '<http://ldf.fi/warsa/photographs/Photograph>',
            preferredLang : 'fi'
        };

        var fetchOptions = { pageSize: PHOTO_PAGE_SIZE };

        function getResults(facetSelections) {
            var selections = facetSelections.constraint;
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
