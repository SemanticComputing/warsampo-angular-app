(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching casualty data.
    */
    angular.module('eventsApp')
    .service('casualtyRepository', function($q, _, AdvancedSparqlService, baseRepository,
            deathRecordMapperService, ENDPOINT_CONFIG, PNR_SERVICE_URI, dateUtilService) {
        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, deathRecordMapperService);

        var prefixes =
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/warsa/casualties/> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX sf: <http://ldf.fi/functions#>'  +
        ' PREFIX wso: <http://ldf.fi/warsa/sources/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ';

        var casualtyLocationsByTimeQry = prefixes +
        ' SELECT ?id ?lat ?lon { ' +
        '  ?id wsc:date_of_death ?death_date . ' +
        '  FILTER(?death_date >= "<START>"^^xsd:date && ?death_date <= "<END>"^^xsd:date) ' +
        '  ?id casualties:municipality_of_death/casualties:preferred_municipality [ geo:lat ?lat ; geo:long ?lon ] . ' +
        ' } ';

        var casualtyCountsByTimeGroupByTypeQry = prefixes +
        ' SELECT ?id ?description (COUNT(?id) AS ?count) { ' +
        '  ?cas_id wsc:date_of_death ?death_date . ' +
        '  FILTER(?death_date >= "<START>"^^xsd:date && ?death_date <= "<END>"^^xsd:date) ' +
        '  ?cas_id casualties:perishing_category ?id . ' +
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
        ' ?cas_id wsc:date_of_death ?death_date . ' +
        ' FILTER(?death_date >= "<START>"^^xsd:date && ?death_date <= "<END>"^^xsd:date) ' +
        ' ?cas_id casualties:perishing_category ?id .  ' +
        ' ?cas_id casualties:unit ?subunit . ' +
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
        ' ?id wsc:date_of_death ?death_date . ' +
        ' FILTER(?death_date >= "<START>"^^xsd:date && ?death_date <= "<END>"^^xsd:date) ' +
        ' ?id casualties:municipality_of_death/casualties:preferred_municipality ?kunta . ' +
        ' ?kunta geo:lat ?lat ; geo:long ?lon . ' +
        ' ?id casualties:unit ?subunit . ' +
        '} ';

        // ?id is predicate
        var personDeathRecordQry = prefixes +
        'SELECT ?id ?label ?description ?obj_link ?source {'  +
        ' ?person crm:P70_documents <ID> . ' +
        ' ?person a wsc:DeathRecord . ' +
        ' ?person ?id ?obj .' +
        ' FILTER(?id != crm:P70_documents) ' +
        ' OPTIONAL { ?id skos:prefLabel ?label . }' +
        ' OPTIONAL { ?obj skos:prefLabel ?obj_lbl . }' +
        ' OPTIONAL { ?obj casualties:preferred_municipality ?mun . }' +
        ' OPTIONAL { SERVICE <PNR> { ?obj skos:prefLabel ?obj_lbl . } }' +
        ' BIND(IF(isIRI(?obj), COALESCE(?mun, ?obj), "") as ?obj_link) '  +
        ' BIND(COALESCE(?obj_lbl, ?obj) as ?description) '  +
        ' wso:source9 skos:prefLabel ?source . ' +
        '} ORDER BY ?label';

        this.getCasualtyLocationsByTime = function(start, end) {
            start = dateUtilService.toISODateString(start);
            end = dateUtilService.toISODateString(end);
            var qry = casualtyLocationsByTimeQry
                .replace(/<START>/g, start)
                .replace(/<END>/g, end);
            return endpoint.getObjects(qry);
        };

        this.getCasualtyLocationsByTimeAndUnit = function(start, end, unit) {
            unit = baseRepository.uriFy(unit);
            start = dateUtilService.toISODateString(start);
            end = dateUtilService.toISODateString(end);
            var qry = casualtyLocationsByTimeAndUnitQry
                .replace(/<START>/g, start)
                .replace(/<END>/g, end)
                .replace(/<ID>/g, unit);
            return endpoint.getObjectsNoGrouping(qry);
        };

        this.getCasualtyCountsByTimeGroupByUnitAndType = function(start, end, unit) {
            unit = baseRepository.uriFy(unit);
            start = dateUtilService.toISODateString(start);
            end = dateUtilService.toISODateString(end);
            var qry = casualtyCountsByTimeGroupByUnitAndTypeQry
                .replace(/<START>/g, start)
                .replace(/<END>/g, end)
                .replace(/<ID>/g, unit);
            return endpoint.getObjects(qry);
        };

        this.getCasualtyCountsByTimeGroupByType = function(start, end) {
            start = dateUtilService.toISODateString(start);
            end = dateUtilService.toISODateString(end);
            var qry = casualtyCountsByTimeGroupByTypeQry
                .replace(/<START>/g, start)
                .replace(/<END>/g, end);
            return endpoint.getObjects(qry);
        };

        this.getPersonDeathRecord = function(id) {
            var qry = personDeathRecordQry
                .replace('<ID>', baseRepository.uriFy(id))
                .replace('<PNR>', baseRepository.uriFy(PNR_SERVICE_URI));
            return endpoint.getObjects(qry);
        };
    });
})();
