(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('eventsApp')

    /*
     * Photo facet service
     */
    .service('cemeteryFacetService', cemeteryFacetService);

    /* @ngInject */
    function cemeteryFacetService($q, $translate, _, cemeteryRepository,
            SPARQL_ENDPOINT_URL, PNR_SERVICE_URI, PHOTO_PAGE_SIZE) {

        this.getResults = getResults;
        this.getFacets = getFacets;
        this.getFacetOptions = getFacetOptions;
        this.getErrorMessage = getErrorMessage;

        var facets = {
            name: {
                facetId: 'name',
                predicate: '<http://www.w3.org/2004/02/skos/core#prefLabel>',
                name: 'CEMETERY_DEMO.NAME',
                enabled: true,
            },
            cemetery_type: {
                facetId: 'cemetery_type',
                predicate: '<http://ldf.fi/schema/warsa/cemeteries/cemetery_type>',
                name: 'CEMETERY_DEMO.CEMETERY_TYPE'
            },
            current_municipality: {
                facetId: 'current_municipality',
                predicate: '<http://ldf.fi/schema/warsa/cemeteries/current_municipality>',
                name: 'CEMETERY_DEMO.CURRENT_MUNICIPALITY'
            },
            former_municipality: {
                facetId: 'former_municipality',
                predicate: '<http://ldf.fi/schema/warsa/cemeteries/former_municipality>',
                name: 'CEMETERY_DEMO.FORMER_MUNICIPALITY'
            },
            camera_club: {
                facetId: 'camera_club',
                predicate: '<http://ldf.fi/schema/warsa/cemeteries/camera_club>',
                name: 'CEMETERY_DEMO.CAMERA_CLUB'
            },
            architect: {
                facetId: 'architect',
                predicate: '<http://ldf.fi/schema/warsa/cemeteries/architect>',
                name: 'CEMETERY_DEMO.ARCHITECT'
            },
            memorial: {
                facetId: 'memorial',
                predicate: '<http://ldf.fi/schema/warsa/cemeteries/memorial>',
                name: 'CEMETERY_DEMO.MEMORIAL'
            },
        };

        var cons =
        '?id skos:prefLabel ?name . ';

        var facetOptions = {
            endpointUrl: SPARQL_ENDPOINT_URL,
            rdfClass: '<http://ldf.fi/schema/warsa/Cemetery>',
            constraint: cons,
            preferredLang : ['fi', 'sv']
        };

        var fetchOptions = { pageSize: PHOTO_PAGE_SIZE };

        function getResults(facetSelections) {
            var selections = facetSelections.constraint;
            return cemeteryRepository.getByFacetSelections(selections, fetchOptions);
        }

        function getFacets() {
            // Translate the facet headers.
            return $translate(_.map(facets, 'name'))
            .then(function(translations) {
                var facetsCopy = angular.copy(facets);
                _.forOwn(facetsCopy, function(val) {
                    val.name = translations[val.name];
                });
                return facetsCopy;
            });
        }

        // function getFacets() {
        //     var facetClone = _.cloneDeep(facets);
        //     return $translate(_.map(facets.period.choices, 'label'))
        //     .then(function(translations) {
        //         facetClone.period.choices.forEach(function(choice) {
        //             var trans = translations[choice.label];
        //             if (trans) {
        //                 choice.label = trans;
        //             }
        //         });
        //         return $translate(_.map(facets, 'name'));
        //     }).then(function(translations) {
        //         _.forOwn(facetClone, function(val) {
        //             var trans = translations[val.name];
        //             if (trans) {
        //                 val.name = trans;
        //             }
        //         });
        //         return facetClone;
        //     });
        // }

        function getFacetOptions() {
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
