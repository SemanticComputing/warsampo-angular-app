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
        this.getErrorMessage = getErrorMessage;

        var facets = {
            taken: {
                facetId: 'taken',
                name: 'PHOTO_DEMO.PHOTO_TAKEN_BETWEEN',
                startPredicate: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span>/<http://www.cidoc-crm.org/cidoc-crm/P82a_begin_of_the_begin>',
                endPredicate: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span>/<http://www.cidoc-crm.org/cidoc-crm/P82b_end_of_the_end>',
                enabled: true
            },
            description: {
                facetId: 'description',
                name: 'PHOTO_DEMO.SEARCH',
                limit: 100000,
                graph: '<http://ldf.fi/warsa/photographs>',
                enabled: true
            },
            period: {
                facetId: 'period',
                name: 'PHOTO_DEMO.PERIOD',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://ldf.fi/schema/warsa/events/related_period>',
                enabled: true,
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
                predicate: '<http://www.cidoc-crm.org/cidoc-crm/P138_represents>',
                specifier: '?value a/rdfs:subClassOf* <http://www.cidoc-crm.org/cidoc-crm/E21_Person> .',
                enabled: true
            },
            unit: {
                facetId: 'unit',
                name: 'PHOTO_DEMO.UNIT',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P11_had_participant>',
                hierarchy: '^<http://www.cidoc-crm.org/cidoc-crm/P143_joined>/<http://www.cidoc-crm.org/cidoc-crm/P144_joined_with>',
                specifier: '?value a/rdfs:subClassOf* <http://ldf.fi/schema/warsa/Group> .',
                depth: 10
            },
            photographer: {
                facetId: 'photographer',
                name: 'PHOTO_DEMO.PHOTOGRAPHER',
                predicate: '^<http://www.cidoc-crm.org/cidoc-crm/P94_has_created>/<http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by>'
            },
            theme: {
                facetId: 'theme',
                name: 'PHOTO_DEMO.THEME_CODE',
                predicate: '<http://ldf.fi/schema/warsa/photographs/theme>'
            }
        };

        var cons =
        '?id <http://www.cidoc-crm.org/cidoc-crm/P1_is_identified_by> ?order . ' +
        '?id <http://ldf.fi/schema/warsa/photographs/is_color> ?color . ';

        var fetchOptions = { pageSize: PHOTO_PAGE_SIZE };

        var facetOptions = {
            endpointUrl: SPARQL_ENDPOINT_URL,
            rdfClass: '<http://ldf.fi/schema/warsa/Photograph>',
            constraint: cons
        };


        function getResults(facetSelections) {
            var selections = facetSelections.constraint;
            return photoRepository.getByFacetSelections(selections, fetchOptions);
        }

        function getFacets() {
            var facetClone = _.cloneDeep(facets);
            return $translate(_.map(facets, 'name')).then(function(translations) {
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
            var prefLang = $translate.use();
            facetOptions.preferredLang = [prefLang, prefLang === 'en' ? 'fi' : 'en', 'sv'];

            return facetOptions;
        }

        function getErrorMessage(error) {
            var errorMsg = error.message || error;
            if (errorMsg) {
                if (_.includes(errorMsg, 'TextIndexParseException')) {
                    return 'PHOTO_DEMO.TEXT_SEARCH_EXCEPTION';
                }
                return errorMsg;
            }
            return 'UNKNOWN_ERROR';
        }
    }
})();
