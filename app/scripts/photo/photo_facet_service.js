(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('eventsApp')

    /*
     * Photo facet service
     */
    .service( 'photoFacetService', photoFacetService );

    /* @ngInject */
    function photoFacetService($q, $translate, _, FacetResultHandler,
            photoMapperService, PHOTO_PAGE_SIZE ) {
        var endpointUrl = 'http://ldf.fi/warsa/sparql';

        var facets = {
            '<http://ldf.fi/kuvanottoaika>' : {
                name: 'PHOTO_TAKEN_BETWEEN',
                type: 'timespan',
                start: '<http://purl.org/dc/terms/created>',
                end: '<http://purl.org/dc/terms/created>',
                min: '1939-10-01',
                max: '1945-12-31'
            },
            '<http://purl.org/dc/terms/description>': { name: 'DESCRIPTION', type: 'text' },
            '<http://purl.org/dc/terms/spatial>': {
                name: 'PLACE',
                service: '<http://ldf.fi/pnr/sparql>'
            },
            '<http://purl.org/dc/terms/subject>': { name: 'PARTICIPANT' },
            '<http://purl.org/dc/terms/creator>': { name: 'PHOTOGRAPHER' }
        };

        var resultHandler = new FacetResultHandler(endpointUrl, facets,
                photoMapperService, PHOTO_PAGE_SIZE);

        var properties = [
            '?description',
            '?created',
            '?place_id',
            '?place_label',
            '?place_string',
            '?participant_id',
            '?url',
            '?thumbnail_url'
        ];

        var facetOptions = {
            endpointUrl: endpointUrl,
            graph : '<http://ldf.fi/warsa/photographs>',
            rdfClass: '<http://ldf.fi/warsa/photographs/Photograph>',
            preferredLang : 'fi'
        };

        var prefixes =
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX text: <http://jena.apache.org/text#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX dctype: <http://purl.org/dc/dcmitype/> ' +
        ' PREFIX dc: <http://purl.org/dc/terms/> ';

        var resultSet =
        ' SELECT DISTINCT ?id { ' +
        '   <FACET_SELECTIONS> ' +
        '   ?s a photos:Photograph .' +
        '   BIND(?s AS ?id) ' +
        ' } ORDER BY ?s ' +
        ' <PAGE> ';

        var resultSetQry = prefixes + resultSet;

        var query = prefixes +
        ' SELECT DISTINCT ?id <PROPERTIES> ' +
        ' WHERE { ' +
        '   { ' +
        '     <RESULTSET> ' +
        '   } ' +
        '   ?id sch:contentUrl ?url . ' +
        '   ?id sch:thumbnailUrl ?thumbnail_url . ' +
        '   OPTIONAL { ' +
        '     ?id dc:spatial ?place_id . ' +
        '     ?place_id skos:prefLabel ?place_label . ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id dc:created ?created . ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id dc:subject ?participant_id . ' +
        '   } ' +
        '   OPTIONAL { ?id photos:place_string ?place_string . } ' +
        '   OPTIONAL { ?id skos:prefLabel ?description . } ' +
        ' }  ';

        query = query.replace(/<RESULTSET>/g, resultSet);
        query = query.replace(/<PROPERTIES>/g, properties.join(' '));

        this.getResults = getResults;
        this.getFacets = getFacets;
        this.getFacetOptions = getFacetOptions;

        function getResults(facetSelections) {
            return resultHandler.getResults(facetSelections, query, resultSetQry);
        }

        function getFacets() {
            return $translate(['PHOTO_TAKEN_BETWEEN', 'DESCRIPTION', 'PLACE',
                    'PARTICIPANT', 'PHOTOGRAPHER'])
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
