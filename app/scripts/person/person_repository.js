(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('personRepository', function($q, _, AdvancedSparqlService, SparqlService,
                baseRepository, personMapperService, QueryBuilderService, ENDPOINT_CONFIG, HISTORY_ENDPOINT_URL) {

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, personMapperService);
        var historyEndpoint = new SparqlService(HISTORY_ENDPOINT_URL);

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX georss: <http://www.georss.org/georss/> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ' +
        ' PREFIX text: <http://jena.apache.org/text#> ' +
        ' PREFIX wacs: <http://ldf.fi/schema/warsa/actors/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var props = '?id ?label ?rank__id ?rank__label ?listLabel ?sname ?fname ?description ' +
        ' ?rank ?rank_id ?natiobib ?wikilink ?sameAs ?casualty ?bury_place ?bury_place_uri ' +
        ' ?living_place ?living_place_uri ?profession ?mstatus ?way_to_die ?cas_unit ?unit_id ' +
        ' ?sid ?source__id ?source__label ?death_id ?cas_date_of_birth ?cas_date_of_death ?birth_id ';

        var select = ' SELECT DISTINCT ' + props;

        var personQryResultSet =
        ' VALUES ?id { <ID> }' +
        ' ?id foaf:familyName ?sname .' +
        ' ?id skos:prefLabel ?label .';

        var personQry = select +
        ' { ' +
        '  <RESULT_SET> ' +
        '  ?id foaf:familyName ?sname .' +
        '  ?id skos:prefLabel ?lbl .' +
        '  OPTIONAL { ?id foaf:firstName ?fname . }' +
        '  BIND(IF(BOUND(?fname), CONCAT(?fname, " ", ?sname), ?lbl) AS ?label) ' +
        '  BIND(IF(BOUND(?fname), CONCAT(?sname, ", ", ?fname), ?lbl) AS ?listLabel) ' +
        '  OPTIONAL { ?id ^crm:P100_was_death_of ?death_id . } ' +
        '  OPTIONAL { ?id ^crm:P98_brought_into_life ?birth_id . } ' +
        '  OPTIONAL { ?id dct:description ?description . } ' +
        '  OPTIONAL { ' +
        '   ?id ^crm:P11_had_participant ?promotion . ' +
        '   ?promotion wacs:hasRank ?rank__id . ' +
        '   ?rank__id wacs:level ?rl ; skos:prefLabel ?rank__label . ' +
        '   ?id ^crm:P11_had_participant/wacs:hasRank/wacs:level ?rl2 . ' +
        '   OPTIONAL { ?promotion dct:source/skos:prefLabel ?rank__source . } ' +
        '  } ' +
        '  OPTIONAL { ?id dct:source ?source__id . ' +
        '   OPTIONAL { ?source__id skos:prefLabel ?source__label . } ' +
        '  }' +
        '  OPTIONAL { ' +
        '   ?id owl:sameAs ?natiobib . FILTER(REGEX(STR(?natiobib),"ldf.fi/history","i")) ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id owl:sameAs ?sameAs . ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id foaf:page ?wikilink . FILTER(REGEX(STR(?wikilink),"wikipedia","i")) ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id crm:P70i_is_documented_in ?casualty . ' +
        '   ?casualty a wsc:DeathRecord . ' +
        '   OPTIONAL { ?casualty casualties:date_of_birth ?cas_date_of_birth . } ' +
        '   OPTIONAL { ?casualty casualties:date_of_death ?cas_date_of_death . } ' +
        '   OPTIONAL { ?casualty casualties:unit_literal ?cas_unit . } ' +
        '   OPTIONAL { ?casualty casualties:unit ?unit_id . } ' +
        '   OPTIONAL { ?casualty casualties:rank ?rank_id . } ' +
        '   OPTIONAL { ' +
        '    ?casualty casualties:perishing_category/skos:prefLabel ?way_to_die . ' +
        '   } ' +
        '  }' +
        ' } GROUP BY ' + props +
        ' HAVING (MAX(COALESCE(?rl, 1)) >= MAX(COALESCE(?rl2, 1))) ';

        var nationalBibliographyQry = prefixes +
        ' SELECT DISTINCT ?id ?name ?images ?shortDescription ?description' +
        '  ?placeOfBirth ?dateOfBirth ' +
        '  ?placeOfDeath ?dateOfDeath ' +
        ' WHERE {' +
        '  VALUES ?id { <ID> }' +
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
        'SELECT DISTINCT ?name ?rank ?id WHERE {	' +
        ' { ' +
        '  SELECT DISTINCT ?name ?id WHERE {	' +
        '   GRAPH <http://ldf.fi/warsa/persons> {	' +
        '    ?id text:query ("<QUERY>" 1000000) . ' +
        '    ?id a wsc:Person . ' +
        '    ?id foaf:familyName ?familyName . ' +
        '    OPTIONAL { ?id foaf:firstName ?firstName . } ' +
        '    BIND(CONCAT(?familyName, ", ", COALESCE(?firstName, "?")) AS ?name) ' +
        '    FILTER (regex(?name, "<REGEX>", "i"))	' +
        '   } 	' +
        '  } LIMIT 1000	' +
        ' } ' +
        ' OPTIONAL { ' +
        '  ?id ^crm:P11_had_participant/wacs:hasRank [ wacs:level ?rl ; skos:prefLabel ?rank ] . ' +
        '  ?id ^crm:P11_had_participant/wacs:hasRank/wacs:level ?rl2 . ' +
        ' } ' +
        '} GROUP BY ?name ?rank ?id ' +
        ' HAVING (MAX(COALESCE(?rl, 1)) >= MAX(COALESCE(?rl2, 1))) ' +
        ' ORDER BY ?name ';

        var wardiaryQry = prefixes +
        'SELECT ?label ?id ?time ' +
        'WHERE { ' +
        '  GRAPH <http://ldf.fi/warsa/diaries> { ' +
        '    VALUES ?actor { <ID> } . ' +
        '    ?uri crm:P70_documents ?actor . ' +
        '    ?uri skos:prefLabel ?label .	' +
        '    ?uri dct:hasFormat ?id . ' +
        '    OPTIONAL { ?uri crm:P4_has_time-span ?time . }	' +
        '  } ' +
        '} ORDER BY ?time ';

        var byUnitQryResultSet =
        ' SELECT DISTINCT ?id (COUNT(?s) AS ?no) { ' +
        '  VALUES ?actor { <ID> } . ' +
        '  ?unit_id (^crm:P143_joined/crm:P144_joined_with)* ?actor . ' +
        '  ?evt a wsc:PersonJoining ; ' +
        '   crm:P144_joined_with ?unit_id ; ' +
        '   crm:P143_joined ?id . ' +
        '  ?id foaf:familyName ?sname . ' +
        '  ?s ?p ?id . ' +
        '  ?id skos:prefLabel ?label . ' +
        ' } GROUP BY ?id ';

        var commandersByUnitQry = prefixes +
        'SELECT ?id ?sname ?fname ?label ?role ?join_start ?join_end WHERE { ' +
        ' VALUES ?unit { <ID> } . ' +
        ' ?evt a wsc:PersonJoining ; ' +
        '   crm:P143_joined ?id . ' +
        ' ?evt  crm:P144_joined_with ?unit .  ' +
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
        '   VALUES ?rank { <ID> } . ' +
        '   ?evt wacs:hasRank ?rank ; ' +
        '    a wsc:Promotion ; ' +
        '    crm:P11_had_participant ?id . ' +
        '   ?id a wsc:Person . ' +
        '   ?s ?p ?id .	' +
        '  } GROUP BY ?id ' +
        ' }	';

        var minimalQry = select +
        ' {	' +
        '  <RESULT_SET> ' +
        '  ?id foaf:familyName ?sname .	' +
        '  OPTIONAL { ?id foaf:firstName ?fname . } ' +
        '  BIND(IF(BOUND(?fname), CONCAT(?sname, ", ", ?fname), ?lbl) AS ?listLabel) ' +
        '  ?id skos:prefLabel ?label . ' +
        ' } ';

        var byMedalQryResultSet =
        ' VALUES ?medal { <ID> } .  ' +
        ' ?evt a wsc:MedalAwarding ;	 ' +
        '   crm:P141_assigned ?medal ; ' +
        '   crm:P11_had_participant ?id .  ' +
        '   ?id a/rdfs:subClassOf* wsc:Person .	' +
        ' ?id foaf:familyName ?sname ; ' +
        '   foaf:firstName ?fname . ';

        var casualtiesByTimeSpanQryResultSet =
        ' ?casualty casualties:date_of_death ?death_time . ' +
        ' FILTER(?death_time >= "<START>"^^xsd:date && ?death_time <= "<END>"^^xsd:date) ' +
        ' ?id crm:P70i_is_documented_in ?casualty . ' +
        ' ?id foaf:familyName ?sname . ';

        var relatedPersonQryResultSet =
        ' SELECT DISTINCT ?id (sum(?score) AS ?totscore){ ' +
        '  ?pclass rdfs:subClassOf* wsc:Person . ' +
        '  { ' +
        '    VALUES ?person { <ACTOR> } ' +
        '    ?person (^crm:P11_had_participant)/crm:P11_had_participant ?id . ' +
        '    FILTER(?person != ?id) ' +
        '    BIND (30 AS ?score) ' +
        '  } UNION { ' +
        '    VALUES ?person { <ACTOR> } ' +
        '    ?person ^crm:P143_joined/crm:P144_joined_with/^crm:P144_joined_with/crm:P143_joined ?id . ' +
        '    FILTER(?person != ?id) ' +
        '    BIND (10 AS ?score) ' +
        '  } UNION { ' +
        '    VALUES ?person { <ACTOR> } ' +
        '    ?person ^crm:P11_had_participant/crm:P141_assigned/^crm:P141_assigned/crm:P11_had_participant ?id . ' +
        '    FILTER(?person != ?id) ' +
        '    BIND (30 AS ?score) ' +
        '  } UNION { ' +
        '    VALUES ?person { <ACTOR> } ' +
            ' ?person foaf:familyName/^foaf:familyName ?id . ' +
            ' FILTER(?person != ?id) ' +
        '    BIND (20 AS ?score) ' +
        '  } ' +
        '  ?id a ?pclass . ' +
        ' } GROUP BY ?id ';

        this.getByUnitId = function(id, pageSize) {
            var orderBy = ' DESC(?no) ';
            var resultSet = byUnitQryResultSet.replace(/<ID>/g, baseRepository.uriFy(id));
            var qryObj = queryBuilder.buildQuery(minimalQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };

        this.getUnitCommanders = function(unitId) {
            var qry = commandersByUnitQry.replace(/<ID>/g, baseRepository.uriFy(unitId));
            return endpoint.getObjects(qry);
        };

        this.getByRankId = function(id, pageSize) {
            var orderBy = ' DESC(?no) ';
            var resultSet = byRankQryResultSet.replace(/<ID>/g, baseRepository.uriFy(id));
            var qryObj = queryBuilder.buildQuery(minimalQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery, 10);
        };

        this.getByMedalId = function(id, pageSize) {
            var orderBy = ' ?sname ?fname ';
            var resultSet = byMedalQryResultSet.replace(/<ID>/g, baseRepository.uriFy(id));
            var qryObj = queryBuilder.buildQuery(minimalQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery, 10);
        };

        this.getByIdList = function(ids, options) {
            ids = baseRepository.uriFy(ids);
            if (!ids) {
                return $q.when();
            }
            options = options || {};
            var resultSet = personQryResultSet.replace(/<ID>/g, ids);
            var qry = personQry;
            if (options.orderBy) {
                qry = qry + 'ORDER BY ' + options.orderBy;
            }
            var qryObj = queryBuilder.buildQuery(qry, resultSet, options.orderBy);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        };

        this.getById = this.getByIdList;

        this.getCasualtiesByTimeSpan = function(start, end, pageSize) {
            var resultSet = casualtiesByTimeSpanQryResultSet.replace(/<START>/g, start).replace(/<END>/g, end);
            var qryObj = queryBuilder.buildQuery(minimalQry, resultSet);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };

        this.getNationalBibliography = function(person) {
            if (person.natiobib) {
                // Direct link by owl:sameAs
                var qry = nationalBibliographyQry.replace(/<ID>/g, baseRepository.uriFy(person.natiobib));
                return historyEndpoint.getObjects(qry).then(function(data) {
                    return personMapperService.makeObjectList(data);
                });
            }
            return $q.when();
        };

        this.getDiaries = function(person) {
            var qry = wardiaryQry.replace(/<ID>/g, baseRepository.uriFy(person));
            return endpoint.getObjects(qry);
        };

        this.getItems = function(text) {
            var textQry = text.trim().replace(/-|\s+/g, '* ') + '*';

            if (text.match(/\s/)) {
                var arr = text.split(/\s+/);
                text = '';
                arr.forEach(function(word) {
                    text += '(?=.*'+ word +')';
                });
            }

            text = _.endsWith(text, '.*') ? text : text + '.*';

            var qry = selectorQuery
                .replace(/<REGEX>/g, text)
                .replace(/<QUERY>/g, textQry);
            return endpoint.getObjects(qry);
        };

        this.getRelatedPersons = function(id, pageSize) {
            id = baseRepository.uriFy(id);
            var resultSet = relatedPersonQryResultSet.replace(/<ACTOR>/g, id);
            var qryObj = queryBuilder.buildQuery(personQry, resultSet, 'DESC(?totscore)');
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery, 5);
        };
    });
})();
