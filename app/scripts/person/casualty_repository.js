(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching casualty data.
    */
    angular.module('eventsApp')
    .service('casualtyRepository', function($q, _, AdvancedSparqlService, baseRepository,
            translateableObjectMapperService, ENDPOINT_CONFIG) {
        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, translateableObjectMapperService);

        var prefixes =
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX sf: <http://ldf.fi/functions#>'  +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ';

        var casualtyLocationsByTimeQry = prefixes +
        ' SELECT ?id ?lat ?lon { ' +
        '  ?id casualties:kuolinaika ?death_date . ' +
        '  FILTER(?death_date >= "<START>"^^xsd:date && ?death_date <= "<END>"^^xsd:date) ' +
        '  ?id casualties:kuolinkunta [ geo:lat ?lat ; geo:long ?lon ] . ' +
        ' } ';

        var casualtyCountsByTimeGroupByTypeQry = prefixes +
        ' SELECT ?id ?description (COUNT(?id) AS ?count) { ' +
        '  ?cas_id casualties:kuolinaika ?death_date . ' +
        '  FILTER(?death_date >= "<START>"^^xsd:date && ?death_date <= "<END>"^^xsd:date) ' +
        '  ?cas_id casualties:menehtymisluokka ?id . ' +
        '  ?id skos:prefLabel ?description . ' +
        ' } ' +
        ' GROUP BY ?id ?description ';

        var casualtyCountsByTimeGroupByUnitAndTypeQry = prefixes +
        'SELECT ?id ?description (COUNT(?id) AS ?count) {   ' +
        ' { ' +
        '  SELECT ?subunit {  ' +
        '   VALUES ?unit { <ID> } . ' +
        '   ?unit (^crm:P144_joined_with/crm:P143_joined)+ ?subunit . ' +
        '   ?subunit a/rdfs:subClassOf* wsc:Group .  ' +
        '  }  ' +
        ' } UNION { ' +
        '  VALUES ?subunit { <ID> } . ' +
        ' } ' +
        ' ?cas_id casualties:kuolinaika ?death_date . ' +
        ' FILTER(?death_date >= "<START>"^^xsd:date && ?death_date <= "<END>"^^xsd:date) ' +
        ' ?cas_id casualties:menehtymisluokka ?id .  ' +
        ' ?cas_id casualties:osasto ?subunit . ' +
        ' ?id skos:prefLabel ?description .  ' +
        '}  GROUP BY ?id ?description  ';

        var casualtyLocationsByTimeAndUnitQry = prefixes +
        'SELECT ?id ?lat ?lon ?death_date ?subunit { ' +
        ' { ' +
        '   SELECT ?subunit { ' +
        '    VALUES ?unit { <ID> } . ' +
        '    ?unit (^crm:P144_joined_with/crm:P143_joined)+ ?subunit . ' +
        '    ?subunit a/rdfs:subClassOf* wsc:Group .  ' +
        '   } ' +
        ' } UNION { ' +
        '   VALUES ?subunit { <ID> } . ' +
        ' } ' +
        ' ?id casualties:kuolinaika ?death_date . ' +
        ' FILTER(?death_date >= "<START>"^^xsd:date && ?death_date <= "<END>"^^xsd:date) ' +
        ' ?id casualties:kuolinkunta ?kunta . ' +
        ' ?kunta geo:lat ?lat ; geo:long ?lon . ' +
        ' ?id casualties:osasto ?subunit . ' +
        '} ';

        // ?id is predicate
        var personDeathRecordQry = prefixes +
        'SELECT ?id ?label ?description ?obj_link {'  +
        ' ?person crm:P70_documents <ID> . ' +
        ' ?person a casualties:DeathRecord . ' +
        ' ?person ?id ?obj .'  +
        ' ?id skos:prefLabel ?label .'  +
        ' OPTIONAL { ?obj skos:prefLabel ?obj_lbl . }' +
        ' BIND(IF(isIRI(?obj), ?obj, "") as ?obj_link) '  +
        ' BIND(COALESCE(?obj_lbl, ?obj) as ?description) '  +
        '} ORDER BY ?label';

        this.getCasualtyLocationsByTime = function(start, end) {
            start = formatDate(start);
            end = formatDate(end);
            var qry = casualtyLocationsByTimeQry
                .replace(/<START>/g, start)
                .replace(/<END>/g, end);
            return endpoint.getObjects(qry);
        };

        this.getCasualtyLocationsByTimeAndUnit = function(start, end, unit) {
            unit = baseRepository.uriFy(unit);
            start = formatDate(start);
            end = formatDate(end);
            var qry = casualtyLocationsByTimeAndUnitQry
                .replace(/<START>/g, start)
                .replace(/<END>/g, end)
                .replace(/<ID>/g, unit);
            return endpoint.getObjectsNoGrouping(qry);
        };

        this.getCasualtyCountsByTimeGroupByUnitAndType = function(start, end, unit) {
            unit = baseRepository.uriFy(unit);
            start = formatDate(start);
            end = formatDate(end);
            var qry = casualtyCountsByTimeGroupByUnitAndTypeQry
                .replace(/<START>/g, start)
                .replace(/<END>/g, end)
                .replace(/<ID>/g, unit);
            return endpoint.getObjects(qry);
        };

        this.getCasualtyCountsByTimeGroupByType = function(start, end) {
            start = formatDate(start);
            end = formatDate(end);
            var qry = casualtyCountsByTimeGroupByTypeQry
                .replace(/<START>/g, start)
                .replace(/<END>/g, end);
            return endpoint.getObjects(qry);
        };

        this.getPersonDeathRecord = function(id) {
            var qry = personDeathRecordQry.replace('<ID>', baseRepository.uriFy(id));
            return endpoint.getObjects(qry);
        };

        function formatDate(date) {
            if (date.toISODateString) {
                return date.toISODateString();
            }
            return date;
        }
    });
})();
