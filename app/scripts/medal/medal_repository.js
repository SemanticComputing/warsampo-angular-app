(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('medalRepository', function($q, AdvancedSparqlService, medalMapperService, ENDPOINT_CONFIG) {

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, medalMapperService);

        var prefixes =
        ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX medal: <http://ldf.fi/warsa/medals/> ';

        var medalQry = prefixes +
        ' SELECT DISTINCT ?id ?label ?description WHERE {  ' +
        '  VALUES ?id { {0} } .   ' +
        '  ?id a medal:Medal . ' +
        '  ?id skos:prefLabel ?label . ' +
        '  ?id a/skos:prefLabel ?type . ' +
        '  OPTIONAL { ?id dc:description|dct:description ?description . } ' +
        ' } ';

        var relatedMedalQry = prefixes +
        ' SELECT DISTINCT ?id ?label WHERE {  ' +
        '  { ' +
        '   SELECT DISTINCT ?id (COUNT(?actor) AS ?no) WHERE {  ' +
        '    VALUES ?medal { {0} } .  ' +
        '    { ' +
        '     SELECT DISTINCT ?actor { ' +
        '      ?evt crm:P141_assigned {0} ; ' +
        '        crm:P11_had_participant ?actor ; ' +
        '        a crm:E13_Attribute_Assignment . ' +
        '     } LIMIT 50 ' +
        '    } ' +
        '    ?evt2 crm:P11_had_participant ?actor ; ' +
        '      crm:P141_assigned ?id ; ' +
        '      a crm:E13_Attribute_Assignment . ' +
        '    FILTER (?medal != ?id) ' +
        '   } GROUP BY ?id ' +
        '  } ' +
        '  ?id skos:prefLabel ?label . ' +
        ' } ORDER BY desc(?no) ';

        this.getById = function(id) {
            var qry = medalQry.format('<{0}>'.format(id));
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Does not exist');
            });
        };

        this.getRelatedMedals = function(id) {
            var qry = relatedMedalQry.format('<{0}>'.format(id));
            return endpoint.getObjects(qry);
        };
    });
})();
