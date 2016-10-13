(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    angular.module('eventsApp')
    .service('placeRepository', placeRepository);

    function placeRepository($q, _, baseRepository, AdvancedSparqlService, translateableObjectMapperService,
            QueryBuilderService, SPARQL_ENDPOINT_URL, PNR_ENDPOINT_URL) {

        var self = this;

        /* Public API */

        // Paging is not supported
        // TODO: Use a union query to support paging

        self.getById = getById;
        self.getNearbyPlaceIds = getNearbyPlaceIds;

        /* Implementation */

        var warsaEndpoint = new AdvancedSparqlService(SPARQL_ENDPOINT_URL, translateableObjectMapperService);
        var pnrEndpoint = new AdvancedSparqlService(PNR_ENDPOINT_URL, translateableObjectMapperService);

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
        ' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
        ' PREFIX sch: <http://schema.org/>' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> ' +
        ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> ' +
        ' PREFIX actors: <http://ldf.fi/warsa/actors/> ' +
        ' PREFIX articles: <http://ldf.fi/schema/warsa/articles/> ';

        var select =
            ' SELECT DISTINCT ?id ?label ?municipality_id ?municipality__id ' +
            ' ?municipality__label ?point__lat ?point__lon ';

        var warsaPlaceQry =
        '{ ' +
        ' VALUES ?id { <ID> } ' +
        ' ?id skos:prefLabel ?label . ' +
        ' OPTIONAL { ?id sch:polygon ?polygon . } ' +
        ' OPTIONAL { ' +
        '   ?id geo:lat ?point__lat ; ' +
        '      geo:long ?point__lon . ' +
        ' } ' +
        ' OPTIONAL { ' +
        '   ?id geosparql:sfWithin ?municipality_id . ' +
        '   ?municipality_id a suo:kunta . ' +
        '   ?municipality_id skos:prefLabel ?municipality__label . ' +
        '   BIND(?municipality_id AS ?municipality__id) ' +
        ' } ' +
        '} ';

        var pnrPlaceQry =
        '{ ' +
        ' VALUES ?id { <ID> } ' +
        ' ?id skos:prefLabel ?label . ' +
        ' FILTER(langMatches(lang(?label), "FI")) ' +
        ' OPTIONAL { ' +
        '   ?id geo:lat ?point__lat ; ' +
        '   geo:long ?point__lon . ' +
        ' } ' +
        ' OPTIONAL { ' +
        '   ?id crm:P89_falls_within ?municipality_id . ' +
        '   { ?municipality_id a <http://ldf.fi/pnr-schema#place_type_540> } ' +
        '   UNION ' +
        '   { ?municipality_id a <http://ldf.fi/pnr-schema#place_type_550> } ' +
        '   ?municipality_id skos:prefLabel ?municipality__label . ' +
        '   BIND(?municipality_id AS ?municipality__id) ' +
        ' } ' +
        '} ';

        var warsaNearByPlaceQry =
        '{ ' +
        ' VALUES ?ref_place_id { <ID> } ' +
        ' ?ref_place_id geosparql:sfWithin? [ ' +
        '  a suo:kunta ; ^geosparql:sfWithin? ?id ' +
        ' ] . ' +
        '} ';

        var pnrNearByPlaceQry =
        '{ ' +
        ' VALUES ?ref_place_id { <ID> } ' +
        ' ?ref_place_id crm:P89_falls_within? ?mun_id ' +
        ' { ?mun_id a <http://ldf.fi/pnr-schema#place_type_540> } ' +
        ' UNION ' +
        ' { ?mun_id a <http://ldf.fi/pnr-schema#place_type_550> } ' +
        ' ?mun_id ^crm:P89_falls_within? ?id . ' +
        '} ';

        function getById(id) {
            return baseGet(warsaPlaceQry, pnrPlaceQry, id);
        }

        function getNearbyPlaceIds(id) {
            return baseGet(warsaNearByPlaceQry, pnrNearByPlaceQry, id).then(function(places) {
                return _.map(places, 'id');
            });
        }

        function baseGet(warsaQ, pnrQ, id) {
            if (!id) {
                return $q.when();
            }

            var warsaId = [];
            var pnrId = [];

            function pushUri(uri) {
                if (isPnrPlace(uri)) {
                    pnrId.push(uri);
                } else {
                    warsaId.push(uri);
                }
            }

            id = _.castArray(id);
            id.forEach(function(uri) {
                pushUri(uri);
            });

            warsaQ = prefixes + select + warsaQ.replace('<ID>', baseRepository.uriFy(warsaId));
            pnrQ = prefixes + select + pnrQ.replace('<ID>', baseRepository.uriFy(pnrId));

            return $q.all([
                warsaEndpoint.getObjects(warsaQ),
                pnrEndpoint.getObjects(pnrQ)
            ]).then(function(places) {
                return _.flatten(places);
            });
        }

        function isPnrPlace(uri) {
            return _.includes(uri, 'ldf.fi/pnr/');
        }
    }
})();
