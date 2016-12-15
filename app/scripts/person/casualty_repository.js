(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching casualty data.
    */
    angular.module('eventsApp')
    .service('casualtyRepository', function($q, _, SparqlService, objectMapperService,
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

        var casualtyLocationsByTimeQry = prefixes +
        ' SELECT ?id ?lat ?lon ' +
        ' WHERE { ' +
        '        ?id casualties:kuolinaika ?death_date . ' +
        '        FILTER(?death_date >= "{0}"^^xsd:date && ?death_date <= "{1}"^^xsd:date) ' +
        '        ?id casualties:kuolinkunta [ geo:lat ?lat ; geo:long ?lon ] . ' +
        ' } ';

        var casualtyCountByTimeQry = prefixes +
        ' SELECT (COUNT(?id) AS ?count) ' +
        ' WHERE { ' +
        '        ?id casualties:kuolinaika ?death_date . ' +
        '        FILTER(?death_date >= "{0}"^^xsd:date && ?death_date <= "{1}"^^xsd:date) ' +
        ' } ';

        var casualtyCountsByTimeGroupByTypeQry = prefixes +
        ' SELECT ?id ?description (COUNT(?id) AS ?count) ' +
        ' WHERE { ' +
        '        ?cas_id casualties:kuolinaika ?death_date . ' +
        '        FILTER(?death_date >= "{0}"^^xsd:date && ?death_date <= "{1}"^^xsd:date) ' +
        '        ?cas_id casualties:menehtymisluokka ?id . ' +
        '        ?id skos:prefLabel ?description . ' +
        ' } ' +
        ' GROUP BY ?id ?description ';

        var casualtyCountsByTimeGroupByUnitAndTypeQry = prefixes +
        'PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/>	' +
        'SELECT ?id ?description (COUNT(?id) AS ?count)  WHERE {  	' +
        '  { SELECT ?subunit 	' +
        '    	WHERE { 	' +
        '      		VALUES ?unit { <{2}> } .	' +
        '          ?unit (^crm:P144_joined_with/crm:P143_joined)+ ?subunit .	' +
        '          ?subunit a atypes:MilitaryUnit . 	' +
        '    	} 	' +
        '  	} UNION {	' +
        '    	VALUES ?subunit { <{2}> } .	' +
        '   }	' +
        '  	' +
        '  ?cas_id casualties:kuolinaika ?death_date .         	' +
        '        FILTER(?death_date >= "{0}"^^xsd:date && ?death_date <= "{1}"^^xsd:date) ' +
        '  ?cas_id casualties:menehtymisluokka ?id . 	' +
        '  ?cas_id casualties:osasto ?subunit .	' +
        '  ?id skos:prefLabel ?description . 	' +
        '}  GROUP BY ?id ?description 	';

        var casualtyLocationsByTimeAndUnitQry = prefixes +
        'SELECT ?id ?lat ?lon ?death_date ?subunit ' +
        'WHERE {	' +
        '   { SELECT ?subunit 	' +
        '    	WHERE { 	' +
        '      		VALUES ?unit { <{2}> } .	' +
        '          ?unit (^crm:P144_joined_with/crm:P143_joined)+ ?subunit .	' +
        '          ?subunit a atypes:MilitaryUnit . 	' +
        '    	} 	' +
        '  	} UNION {	' +
        '    	VALUES ?subunit { <{2}> } .	' +
        '    }	' +
        '	?id casualties:kuolinaika ?death_date .        	' +
        '  FILTER(?death_date >= "{0}"^^xsd:date && ?death_date <= "{1}"^^xsd:date) ' +
        '	?id casualties:kuolinkunta ?kunta . 	' +
        '	?kunta geo:lat ?lat ; geo:long ?lon . 	' +
        '  	?id casualties:osasto ?subunit .	' +
        '}	';

        var personDeathRecordQry = prefixes +
        'SELECT ?id ?pred_lbl ?obj_text ?obj_link WHERE {'  +
        '   ?id crm:P70_documents <{0}> . ' +
        '   ?id ?pred ?obj .'  +
        '   ?pred sf:preferredLanguageLiteral (skos:prefLabel rdfs:label "{1}" "fi" "" ?pred_lbl) .'  +
        '   OPTIONAL {' +
        '   	?obj sf:preferredLanguageLiteral (skos:prefLabel rdfs:label "{1}" "fi" "" ?obj_lbl) .'  +
        '   }' +
        '   BIND(IF(isIRI(?obj), ?obj, "") as ?obj_link) .'  +
        '   BIND(COALESCE(?obj_lbl, ?obj) as ?obj_text)'  +
        '} ORDER BY ?pred_lbl';

        this.getCasualtyLocationsByTime = function(start, end) {
            start = formatDate(start);
            end = formatDate(end);
            var qry = casualtyLocationsByTimeQry.format(start, end);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };

        this.getCasualtyLocationsByTimeAndUnit = function(start, end, unit) {
            // Expects a single unit
            start = formatDate(start);
            end = formatDate(end);
            var qry = casualtyLocationsByTimeAndUnitQry.format(start, end, unit);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectListNoGrouping(data);
            });
        };

        this.getCasualtyCountsByTimeGroupByUnitAndType = function(start, end, unit) {
            // Expects a single unit
            start = formatDate(start);
            end = formatDate(end);
        console.log(start,end);
            var qry = casualtyCountsByTimeGroupByUnitAndTypeQry.format(start, end, unit);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };

        this.getCasualtyCountByTime = function(start, end) {
            start = formatDate(start);
            end = formatDate(end);
            var qry = casualtyCountByTimeQry.format(start, end);
            return endpoint.getObjects(qry).then(function(data) {
                return data[0].count.value;
            });
        };

        this.getCasualtyCountsByTimeGroupByType = function(start, end) {
            start = formatDate(start);
            end = formatDate(end);
            var qry = casualtyCountsByTimeGroupByTypeQry.format(start, end);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };

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
