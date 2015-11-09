'use strict';

/*
 * Service that provides an interface for fetching casualty data.
 */
angular.module('eventsApp')
    .service('casualtyService', function($q, SparqlService, objectMapperService) {
        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var prefixes = '' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' + 
        ' PREFIX georss: <http://www.georss.org/georss/> ';

        var casualtyLocationsByTimeQry = prefixes +
        ' SELECT ?id ?lat ?lon ' +
        ' WHERE { ' +
        '        ?id casualties:kuolinaika ?death_date . ' +
        '        FILTER(?death_date >= "{0}"^^xsd:date && ?death_date <= "{1}"^^xsd:date) ' +
        '        ?id casualties:kuolinkunta ?kunta . ' +
        '        SERVICE <http://ldf.fi/warsa/sparql> { ' +
        '               ?kunta geo:lat ?lat ; geo:long ?lon . ' +
        '        } ' +
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

        var casualtyInfoQry = prefixes +
        ' SELECT * ' +
        ' WHERE { ' +
        '   VALUES ?id { {0} } ' +
        '   ?id ' +
        '    casualties:sotilasarvo ?sotilasarvo_id ; ' +
        '    casualties:ammatti ?ammatti ; ' +
        '    casualties:kuolinpaikka ?kuolinpaikka ; ' +
        '    casualties:kuolinaika ?kuolinaika ; ' +
        '    casualties:syntymaeaika ?syntymaeaika ; ' +
        '    casualties:synnyinkunta ?synnyinkunta ; ' +
        '    casualties:etunimet ?etunimet ; ' +
        '    casualties:menehtymisluokka ?menehtymisluokka_id ; ' +
        '    casualties:sukunimi ?sukunimi ; ' +
        '    casualties:kansalaisuus ?kansalaisuus ; ' +
        '    casualties:joukko_osasto ?joukko_osasto ; ' +
        '    casualties:kotikunta ?kotikunta ; ' +
        '    casualties:hautausmaa ?hautausmaa ; ' +
        '    casualties:kansallisuus ?kansallisuus ; ' +
        '    casualties:lasten_lukumaeaerae ?lasten_lukumaeaerae ; ' +
        '    casualties:sukupuoli ?sukupuoli ; ' +
        '    casualties:hautapaikka ?hautapaikka ; ' +
        '    casualties:hautauskunta ?hautauskunta ; ' +
        '    casualties:siviilisaeaety ?siviilisaeaety_id ; ' +
        '    casualties:aeidinkieli ?aeidinkieli ; ' +
        '    casualties:asuinkunta ?asuinkunta . ' +
        '    ?sotilasarvo_id skos:prefLabel ?sotilasarvo . ' +
        '    ?siviilisaeaety_id skos:prefLabel ?siviilisaeaety . ' +
        '    ?menehtymisluokka_id skos:prefLabel ?menehtymisluokka . ' +
        ' } ';

			var casualtyLocationsByTimeAndUnitQry = '' +
		   ' 	PREFIX : <http://ldf.fi/warsa/actors/>  ' +
           '     PREFIX events: <http://ldf.fi/warsa/events/> ' +
           '     PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/>  ' +
           '     PREFIX etypes: <http://ldf.fi/warsa/events/event_types/>  ' +
           '     PREFIX ranks: <http://ldf.fi/warsa/actors/ranks/> ' +
           '     PREFIX dcterms: <http://purl.org/dc/terms/>  ' +
           '     PREFIX foaf: <http://xmlns.com/foaf/0.1/>  ' +
           '     PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
           '     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  ' +
           '     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
           '     PREFIX skos: <http://www.w3.org/2004/02/skos/core#>  ' +
           '     PREFIX xml: <http://www.w3.org/XML/1998/namespace>  ' +
           '     PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>  ' +
           '     PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>  ' +
           '     PREFIX owl: <http://www.w3.org/2002/07/owl#>  ' +
           '     PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
           '     SELECT ?id ?lat ?lon  ' +
           '     WHERE {  ' +
           '             ?id a foaf:Person . ' +
           '             VALUES ?unit { {2} } ' +
           '             ?id casualties:kuolinaika ?death_date . ' +
           '             FILTER(?death_date >= "1939-09-09"^^xsd:date && ?death_date <= "1940-03-30"^^xsd:date) ' +
           '             ?id casualties:kuolinkunta ?kunta . ' +
           '             ?id casualties:osasto ?unit . ' +
           '             ?kunta geo:lat ?lat ; geo:long ?lon .  ' +
           '     }  ';


        this.getCasualtyLocationsByTime = function(start, end) {
            var qry = casualtyLocationsByTimeQry.format(start, end);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };

        this.getCasualtyCountByTime = function(start, end) {
            var qry = casualtyCountByTimeQry.format(start, end);
            return endpoint.getObjects(qry).then(function(data) {
                return data[0].count.value;
            });
        };

        this.getCasualtyCountsByTimeGroupByType = function(start, end) {
            var qry = casualtyCountsByTimeGroupByTypeQry.format(start, end);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };

        this.getCasualtyInfo = function(ids) {
            var qry;
            if (_.isArray(ids)) {
                ids = "<{0}>".format(ids.join("> <"));
            } else if (ids) {
                ids = "<{0}>".format(ids);
            } else {
                return $q.when();
            }
            qry = casualtyInfoQry.format(ids);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };

        this.getCasualtyLocationsByTimeAndUnit = function(start, end, unit) {
            var qry = casualtyLocationsByTimeAndUnitQry.format(start, end, unit);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };

});

