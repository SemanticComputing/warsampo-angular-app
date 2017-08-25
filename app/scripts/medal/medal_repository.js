(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('medalRepository', function($q, AdvancedSparqlService, baseRepository, medalMapperService, ENDPOINT_CONFIG) {

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, medalMapperService);

        var prefixes =
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ';

        var medalQry = prefixes +
        ' SELECT DISTINCT ?id ?label ?description WHERE {  ' +
        '  VALUES ?id { <ID> } .   ' +
        '  ?id a wsc:Medal . ' +
        '  ?id skos:prefLabel ?label . ' +
        '  ?id a/skos:prefLabel ?type . ' +
        '  OPTIONAL { ?id dct:description ?description . } ' +
        ' } ';

        var relatedMedalQry = prefixes +
        ' SELECT DISTINCT ?id ?label WHERE {  ' +
        '  { ' +
        '   SELECT DISTINCT ?id (COUNT(?actor) AS ?no) WHERE {  ' +
        '    VALUES ?medal { <ID> } .  ' +
        '    { ' +
        '     SELECT DISTINCT ?actor { ' +
        '      VALUES ?medal { <ID> } .  ' +
        '      ?evt crm:P141_assigned ?medal ; ' +
        '        crm:P11_had_participant ?actor ; ' +
        '        a wsc:MedalAwarding . ' +
        '     } LIMIT 50 ' +
        '    } ' +
        '    ?evt2 crm:P11_had_participant ?actor ; ' +
        '      crm:P141_assigned ?id ; ' +
        '      a wsc:MedalAwarding . ' +
        '    FILTER (?medal != ?id) ' +
        '   } GROUP BY ?id ' +
        '  } ' +
        '  ?id skos:prefLabel ?label . ' +
        ' } ORDER BY desc(?no) ';

        this.getById = function(id) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = medalQry.replace(/<ID>/g, id);
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Does not exist');
            });
        };

        this.getRelatedMedals = function(id) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = relatedMedalQry.replace(/<ID>/g, id);
            return endpoint.getObjects(qry);
        };
    });
})();
