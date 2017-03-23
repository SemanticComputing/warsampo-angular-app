(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching casualty data.
    */
    angular.module('eventsApp')
    .service('prisonerRepository', function($q, _, SparqlService, objectMapperService,
            ENDPOINT_CONFIG) {
        var endpoint = new SparqlService(ENDPOINT_CONFIG);

        var prefixes =
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 	' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>	' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> 	' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX sf: <http://ldf.fi/functions#>'  +
        ' PREFIX georss: <http://www.georss.org/georss/> ';
        ' PREFIX prisoners: <http://ldf.fi/schema/warsa/prisoners/> ';

        var personDeathRecordQry = prefixes +
        'SELECT ?id ?pred_lbl ?obj_text ?obj_link WHERE {'  +
        '   ?id crm:P70_documents <{0}> . ' +
        '   ?id a prisoners:PrisonerOfWar . ' +
        '   ?id ?pred ?obj .'  +
        '   ?pred sf:preferredLanguageLiteral (skos:prefLabel rdfs:label "{1}" "fi" "" ?pred_lbl) .'  +
        '   OPTIONAL {' +
        '   	?obj sf:preferredLanguageLiteral (skos:prefLabel rdfs:label "{1}" "fi" "" ?obj_lbl) .'  +
        '   }' +
        '   BIND(IF(isIRI(?obj), ?obj, "") as ?obj_link) .'  +
        '   BIND(COALESCE(?obj_lbl, ?obj) as ?obj_text)'  +
        '} ORDER BY ?pred_lbl';


        this.getPersonDeathRecord = function(id, lang) {
            var qry = personDeathRecordQry.format(id, lang || 'fi');
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectListNoGrouping(data);
            });
        };

        function formatDate(date) {
            if (date.toISODateString) {
                return date.toISODateString();
            }
            return date;
        }
    });
})();
