(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('medalRepository', function($q, SparqlService, medalMapperService, SPARQL_ENDPOINT_URL) {

        var endpoint = new SparqlService(SPARQL_ENDPOINT_URL);

        var prefixes =
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ' +
        ' PREFIX wme: <http://ldf.fi/warsa/medals/> ';

        var medalQry = prefixes +
        ' SELECT DISTINCT ?id ?label WHERE {  ' +
        '  VALUES ?id { {0} } .   ' +
        '  ?id a wsc:Medal . ' +
        '  ?id skos:prefLabel ?label . ' +
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
            var qry = medalQry.format('<{0}>'.format(id));
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return medalMapperService.makeObjectList(data)[0];
                }
                return $q.reject('Does not exist');
            });
        };

        this.getRelatedMedals = function(id) {
            var qry = relatedMedalQry.format('<{0}>'.format(id));
            return endpoint.getObjects(qry).then(function(data) {
                return medalMapperService.makeObjectList(data);
            });
        };
    });
})();
