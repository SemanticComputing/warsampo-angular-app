(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('personRepository', function($q, _, AdvancedSparqlService, SparqlService,
                baseRepository, personMapperService, QueryBuilderService, ENDPOINT_CONFIG) {

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, personMapperService);
        var historyEndpoint = new SparqlService('http://ldf.fi/history/sparql');

        var prefixes =
        ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX georss: <http://www.georss.org/georss/> ' +
        ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var select =
        ' SELECT DISTINCT ?id ?label ?sname ?fname ?description ?rank ?rank_id ' +
        '  ?natiobib ?wikilink ?casualty ?bury_place ?bury_place_uri ?living_place ' +
        '  ?living_place_uri ?profession ?mstatus ?way_to_die ?cas_unit ' +
        '  ?sid ?source ';

        var personQryResultSet =
        ' VALUES ?id { {0} }' +
        ' ?id foaf:familyName ?sname .' +
        ' ?id skos:prefLabel ?label .';

        var personQry = select +
        ' { ' +
        '  <RESULT_SET> ' +
        '  ?id foaf:familyName ?sname .' +
        '  ?id skos:prefLabel ?lbl .' +
        '  OPTIONAL { ?id foaf:firstName ?fname . }' +
        '  BIND(IF(BOUND(?fname), CONCAT(?fname, " ", ?sname), ?lbl) AS ?label) ' +
        '  OPTIONAL { ?id dc:description ?description } ' +
        '  OPTIONAL { ?id dc:source ?sid . ' +
        '   OPTIONAL { ?sid skos:prefLabel ?source . ' +
        '               FILTER( lang(?source)="fi" ) ' +
        '   } ' +
        '  }' +
        '  OPTIONAL { ' +
        '   ?id owl:sameAs ?natiobib . FILTER(REGEX(STR(?natiobib),"ldf.fi/history","i")) ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id foaf:page ?wikilink . FILTER(REGEX(STR(?wikilink),"wikipedia","i")) ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id crm:P70i_is_documented_in ?casualty . ' +
        '   ?casualty a casualties:DeathRecord . ' +
        '   OPTIONAL { ' +
        '    ?casualty casualties:hautauskunta ?bury_place_uri . ' +
        '    ?bury_place_uri skos:prefLabel ?bury_place . ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    ?casualty casualties:asuinkunta ?living_place_uri . ' +
        '    ?living_place_uri skos:prefLabel ?living_place . }' +
        '   OPTIONAL { ?casualty casualties:joukko_osasto ?cas_unit . }' +
        '   OPTIONAL { ' +
        '    ?casualty casualties:menehtymisluokka ?way_id . ' +
        '    ?way_id skos:prefLabel ?way_to_die . ' +
        '   } '+
        '  }' +
        ' } ';

        var nationalBibliographyQry = prefixes +
        ' SELECT DISTINCT ?id ?name ?images ?shortDescription ?description' +
        '  ?placeOfBirth ?dateOfBirth ' +
        '  ?placeOfDeath ?dateOfDeath ' +
        ' WHERE {' +
        '  VALUES ?id { <{0}> }' +
        '  ?id rdfs:label ?name .' +
        '  ?id sch:birthDate ?dateOfBirth .' +
        '  ?id sch:deathDate ?dateOfDeath .' +
        '  OPTIONAL {?birth crm:P98_brought_into_life ?id . ' +
        '   ?birth crm:P7_took_place_at ?place . ' +
        '   ?place rdfs:label ?placeOfBirth .} ' +
        '  OPTIONAL {?death crm:P100_was_death_of ?id . ' +
        '   ?death crm:P7_took_place_at ?placeD . ' +
        '   ?placeD rdfs:label ?placeOfDeath . } ' +
        '  OPTIONAL {?id sch:image ?images } ' +
        '  OPTIONAL {?id dct:type ?shortDescription } ' +
        '  OPTIONAL {?id rdfs:comment ?description } ' +
        '} ORDER BY DESC(?dateOfDeath) LIMIT 1 ';

        //	Query for searching people with matching names: 'La' -> 'Laine','Laaksonen' etc
        var selectorQuery = prefixes +
        'SELECT DISTINCT ?name ?id WHERE {	' +
        '  SELECT DISTINCT ?name ?id WHERE {	' +
        '    GRAPH <http://ldf.fi/warsa/actors> {	' +
        '      { ?id a crm:E21_Person } UNION { ?id a atypes:PoliticalPerson } UNION { ?id a atypes:MilitaryPerson . } ' +
        '      ?id skos:prefLabel ?name .   	    	' +
        '      FILTER (regex(?name, "^{0}$", "i"))	' +
        '    } 	' +
        '  } LIMIT 300 	' +
        '} ORDER BY ?name 	';

        var wardiaryQry = prefixes +
        'SELECT ?label ?id ?time	' +
        'WHERE {	' +
        '  GRAPH <http://ldf.fi/warsa/diaries> {	' +
        '    VALUES ?actor { {0} } .	' +
        '    ?uri crm:P70_documents ?actor .	' +
        '    ?uri skos:prefLabel ?label .	' +
        '    ?uri <http://purl.org/dc/terms/hasFormat> ?id .	' +
        '    OPTIONAL { ?uri crm:P4_has_time-span ?time . }	' +
        '    }	' +
        '} ORDER BY ?time	';

        var byUnitQryResultSet =
        ' SELECT ?id (COUNT(?s) AS ?no) { ' +
        '  ?evt a etypes:PersonJoining ; ' +
        '  crm:P143_joined ?id . ' +
        '  ?evt  crm:P144_joined_with {0} .  ' +
        '  ?s ?p ?id . ' +
        '  ?id skos:prefLabel ?label . ' +
        '  ?id foaf:familyName ?sname . ' +
        ' } GROUP BY ?id ';

        var byUnitQry =
        'SELECT ?id ?sname ?fname ?label ?rank ?role ?join_start ?join_end WHERE { ' +
        '   <RESULT_SET> ' +
        ' 	OPTIONAL { ' +
        ' 	  ?evt a etypes:PersonJoining ; ' +
        ' 	  crm:P143_joined ?id . ' +
        '     OPTIONAL { ?evt crm:P107_1_kind_of_member ?role . } ' +
        '     OPTIONAL { ' +
        '         ?evt crm:P4_has_time-span ?join_time_id . ' +
        '         ?join_time_id crm:P82a_begin_of_the_begin ?join_start ; ' +
        '             crm:P82b_end_of_the_end ?join_end . ' +
        '     } ' +
        '	} ' +
        '   ?id skos:prefLabel ?label . ' +
        '   ?id foaf:familyName ?sname .	' +
        '   OPTIONAL { ?id foaf:firstName ?fname .	} ' +
        '}';

        var commandersByUnitQry = prefixes +
        'SELECT ?id ?sname ?fname ?label ?role ?join_start ?join_end WHERE { ' +
        ' ?evt a etypes:PersonJoining ; ' +
        '   crm:P143_joined ?id . ' +
        ' ?evt  crm:P144_joined_with {0} .  ' +
        ' ?evt crm:P107_1_kind_of_member ?role . ' +
        ' OPTIONAL { ' +
        '  ?evt crm:P4_has_time-span ?join_time_id . ' +
        '  ?join_time_id crm:P82a_begin_of_the_begin ?join_start ; ' +
        '    crm:P82b_end_of_the_end ?join_end . ' +
        ' } ' +
        ' ?id skos:prefLabel ?label . ' +
        ' ?id foaf:familyName ?sname .	' +
        ' OPTIONAL { ?id foaf:firstName ?fname . } ' +
        '} ';

        var byRankQryResultSet =
        ' { ' +
        '  SELECT DISTINCT ?id (COUNT(?s) AS ?no) WHERE { ' +
        '   VALUES ?rank { {0} } . ' +
        '   ?evt :hasRank ?rank . ' +
        '   ?evt crm:P11_had_participant ?id . ' +
        '   ?evt a etypes:Promotion .	' +
        '   ?id a atypes:MilitaryPerson .	' +
        '   ?s ?p ?id .	' +
        '  } GROUP BY ?id ' +
        ' }	';

        var minimalQry = select +
        ' {	' +
        '  <RESULT_SET> ' +
        '  ?id foaf:familyName ?sname .	' +
        '  OPTIONAL { ?id foaf:firstName ?fname . } ' +
        '  ?id skos:prefLabel ?label . ' +
        ' } ORDER BY ?sname ?fname ';

        var byMedalQryResultSet =
        ' VALUES ?medal { {0} } .  ' +
        ' ?evt a crm:E13_Attribute_Assignment ;	 ' +
        '   crm:P141_assigned ?medal ; ' +
        '   crm:P11_had_participant ?id .  ' +
        ' ?id a atypes:MilitaryPerson .	 ' +
        ' ?id foaf:familyName ?sname ; ' +
        '   foaf:firstName ?fname . ';

        var casualtiesByTimeSpanQryResultSet =
        '   ?casualty casualties:kuolinaika ?death_time . ' +
        '   FILTER(?death_time >= "{0}"^^xsd:date && ?death_time <= "{1}"^^xsd:date) ' +
        '   ?id crm:P70i_is_documented_in ?casualty . ' +
        '   ?id skos:prefLabel ?label . ';

        var casualtiesByTimeSpanQry =
        ' SELECT DISTINCT ?id ?label ?death_time ?casualty ' +
        ' WHERE { ' +
        '   <RESULT_SET> ' +
        '   ?id skos:prefLabel ?label . ' +
        '   ?id crm:P70i_is_documented_in ?casualty . ' +
        '   ?casualty casualties:kuolinaika ?death_time . ' +
        ' } ';

        var relatedPersonQryResultSet =
        ' SELECT DISTINCT ?id { ' +
        '  ?pclass rdfs:subClassOf* crm:E21_Person . ' +
        '  { ' +
        '    VALUES ?person { <ACTOR> } ' +
        '    ?person (^crm:P11_had_participant)/crm:P11_had_participant ?id . ' +
        '    BIND (20 AS ?score) ' +
        '  } UNION { ' +
        '    VALUES ?person { <ACTOR> } ' +
        '    ?person ^crm:P11_had_participant/:hasRank ?rank . ' +
        '    ?rank ^:hasRank/crm:P11_had_participant ?id ; ' +
        '     :level ?score . ' +
        '  } UNION { ' +
        '    VALUES ?person { <ACTOR> } ' +
        '    ?person ^crm:P143_joined/crm:P144_joined_with/^crm:P144_joined_with/crm:P143_joined ?id . ' +
        '    BIND (30 AS ?score) ' +
        '  } UNION { ' +
        '    VALUES ?person { <ACTOR> } ' +
        '    ?person ^crm:P11_had_participant/crm:P141_assigned/^crm:P141_assigned/crm:P11_had_participant ?id . ' +
        '    BIND (30 AS ?score) ' +
        '  } ' +
        '  FILTER(?person != ?id) ' +
        '  ?id a ?pclass . ' +
        ' } GROUP BY ?id ' +
        ' ORDER BY DESC(sum(?score)) ';

        this.getByUnitId = function(id, pageSize) {
            var orderBy = ' DESC(?no) ';
            var resultSet = byUnitQryResultSet.format('<{0}>'.format(id));
            var qryObj = queryBuilder.buildQuery(byUnitQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };

        this.getUnitCommanders = function(unitId) {
            var qry = commandersByUnitQry.format('<{0}>'.format(unitId));
            return endpoint.getObjects(qry);
        };

        this.getByRankId = function(id, pageSize) {
            var orderBy = ' DESC(?no) ';
            var resultSet = byRankQryResultSet.format('<{0}>'.format(id));
            var qryObj = queryBuilder.buildQuery(minimalQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };

        this.getByMedalId = function(id, pageSize) {
            var orderBy = ' ?sname ?fname ';
            var resultSet = byMedalQryResultSet.format('<{0}>'.format(id));
            var qryObj = queryBuilder.buildQuery(minimalQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };

        this.getById = function(id) {
            var resultSet = personQryResultSet.format('<{0}>'.format(id));
            var qryObj = queryBuilder.buildQuery(personQry, resultSet);

            return endpoint.getObjects(qryObj.query).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Does not exist');
            });
        };

        this.getByIdList = function(ids, pageSize) {
            ids = baseRepository.uriFy(ids);
            if (!ids) {
                return $q.when();
            }
            var resultSet = personQryResultSet.format(ids);
            var qryObj = queryBuilder.buildQuery(personQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };

        this.getCasualtiesByTimeSpan = function(start, end, pageSize) {
            var resultSet = casualtiesByTimeSpanQryResultSet.format(start, end);
            var qryObj = queryBuilder.buildQuery(casualtiesByTimeSpanQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };

        this.getNationalBibliography = function(person) {
            if (person.natiobib) {
                // Direct link by owl:sameAs
                var qry = nationalBibliographyQry.format(person.natiobib);
                return historyEndpoint.getObjects(qry).then(function(data) {
                    return personMapperService.makeObjectList(data);
                });
            }
            return $q.when();
        };

        this.getDiaries = function(person) {
            var qry = wardiaryQry.format('<{0}>'.format(person));
            return endpoint.getObjects(qry);
        };

        this.getItems = function(regx) {
            var qry = selectorQuery.format('{0}'.format(regx));
            return endpoint.getObjects(qry).then(function(data) {
                var arr = data;
                if (!arr.length) {
                    arr = [ {id:'#', name:'Ei hakutuloksia.'} ];
                }
                return arr;
            });
        };

        this.getRelatedPersons = function(id, pageSize) {
            id = baseRepository.uriFy(id);
            var resultSet = relatedPersonQryResultSet.replace(/<ACTOR>/g, id);
            var qryObj = queryBuilder.buildQuery(personQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };
    });
})();
