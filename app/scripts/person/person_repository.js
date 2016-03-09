(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('personRepository', function($q, _, AdvancedSparqlService, SparqlService,
                personMapperService, QueryBuilderService) {

        var endpoint = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
            personMapperService);

        var prefixes = '' +
        ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
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
        ' SELECT DISTINCT ?id ?label ?sname ?fname ?note ?rank ?rank_id ?birth_time ' +
        '   ?death_time ?natiobib ?wikilink ?casualty ?birth_place ?birth_place_uri ' +
        '   ?death_place ?death_place_uri ?bury_place ?bury_place_uri ?living_place ' +
        '   ?living_place_uri ?profession ?mstatus ?num_children ?way_to_die ?cas_unit ' +
        '   ?sid ?source ';

        var personQryResultSet =
        '   VALUES ?id { {0} }' +
        '   ?id foaf:familyName ?sname .' +
        '   ?id skos:prefLabel ?label .';

        var personQry = select +
        ' { ' +
        '   <RESULT_SET> ' +
        '   ?id foaf:familyName ?sname .' +
        '   ?id skos:prefLabel ?label .' +
        '   OPTIONAL { ?id foaf:firstName ?fname . }' +
        '   OPTIONAL { ?id crm:P3_has_note ?note . }' +
        '   OPTIONAL { ?id <http://purl.org/dc/elements/1.1/source> ?sid . ' +
        '     OPTIONAL { ?sid skos:prefLabel ?source . } ' +
        '   }' +
        '   OPTIONAL { ?id :hasRank ?rank_id . ?rank_id skos:prefLabel ?rank . }' +
        ' 	OPTIONAL { ' +
        '     ?id owl:sameAs ?natiobib . FILTER(REGEX(STR(?natiobib),"ldf.fi/history","i")) ' +
        '	} ' +
        ' 	OPTIONAL { ' +
        '     ?id foaf:page ?wikilink . FILTER(REGEX(STR(?wikilink),"wikipedia","i")) ' +
        '	} ' +
        '   OPTIONAL { ' +
        '     ?id crm:P70i_is_documented_in ?casualty .' +
        '     OPTIONAL { ?casualty casualties:syntymaeaika ?birth_time . }' +
        '     OPTIONAL { ' +
        '       ?casualty casualties:synnyinkunta ?birth_place_uri . ' +
        '       ?birth_place_uri skos:prefLabel ?birth_place . ' +
        '     } ' +
        '     OPTIONAL { ?casualty casualties:kuolinaika ?death_time . } ' +
        '     OPTIONAL { ' +
        '         ?casualty casualties:kuolinkunta ?death_place_uri . '+
        '         ?death_place_uri skos:prefLabel ?death_place . ' +
        '     }' +
        '     OPTIONAL { ' +
        '         ?casualty casualties:hautauskunta ?bury_place_uri . ' +
        '         ?bury_place_uri skos:prefLabel ?bury_place . ' +
        '     } ' +
        '     OPTIONAL { ' +
        '         ?casualty casualties:asuinkunta ?living_place_uri . '+
        '         ?living_place_uri skos:prefLabel ?living_place . }' +
        '     OPTIONAL { ?casualty casualties:ammatti ?profession . }' +
        '     OPTIONAL {  ' +
        '         ?casualty casualties:siviilisaeaety ?mstatus_uri . ' +
        '         ?mstatus_uri skos:prefLabel ?mstatus . ' +
        '     }' +
        '     OPTIONAL { ?casualty casualties:ammatti ?profession . }' +
        '     OPTIONAL { ?casualty casualties:joukko_osasto ?cas_unit . }' +
        '     OPTIONAL { ?casualty casualties:lasten_lukumaeaerae ?num_children . } '+
        '     OPTIONAL { ' +
        '         ?casualty casualties:menehtymisluokka ?way_id . ' +
        '         ?way_id skos:prefLabel ?way_to_die . ' +
        '     } '+
        '   }' +
        ' } ';

        var nationalBibliographyQry =
        'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
        'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        'PREFIX schema: <http://schema.org/>' +
        'PREFIX dcterms: <http://purl.org/dc/terms/>' +
        'PREFIX cidoc: <http://www.cidoc-crm.org/cidoc-crm/>' +
        ' SELECT DISTINCT ?id ?name ?images ?shortDescription ?description' +
        '   ?placeOfBirth ?dateOfBirth ' +
        '   ?placeOfDeath ?dateOfDeath ' +
        ' WHERE {' +
        '   VALUES ?id { <{0}> }' +
        '   ?id rdfs:label ?name .' +
        '   ?id schema:birthDate ?dateOfBirth .' +
        '   ?id schema:deathDate ?dateOfDeath .' +
        '   OPTIONAL {?birth cidoc:P98_brought_into_life ?id . ' +
        '     ?birth cidoc:P7_took_place_at ?place . ' +
        '     ?place rdfs:label ?placeOfBirth .} ' +
        '   OPTIONAL {?death cidoc:P100_was_death_of ?id . ' +
        '     ?death cidoc:P7_took_place_at ?placeD . ' +
        '     ?placeD rdfs:label ?placeOfDeath . } ' +
        '   OPTIONAL {?id schema:image ?images } ' +
        '   OPTIONAL {?id dcterms:type ?shortDescription } ' +
        '   OPTIONAL {?id rdfs:comment ?description } ' +
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

        var byUnitQryResultSet =
        ' SELECT ?id ?no { ' +
        '  ?evt a etypes:PersonJoining ; ' +
        '  crm:P143_joined ?id . ' +
        '  ?evt  crm:P144_joined_with {0} .  ' +
        '  ?s ?p ?id . ' +
        '  ?id skos:prefLabel ?label . ' +
        '  ?id foaf:familyName ?sname . ' +
        ' }';

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
        '   OPTIONAL { ?id :hasRank ?ranktype . ?ranktype skos:prefLabel ?rank . } ' +
        '}';

        var commandersByUnitQry = prefixes +
        'SELECT ?id ?sname ?fname ?label ?rank ?role ?join_start ?join_end WHERE { ' +
        ' 	 ?evt a etypes:PersonJoining ; ' +
        ' 	    crm:P143_joined ?id . ' +
        ' 	 ?evt  crm:P144_joined_with {0} .  ' +
        '    ?evt crm:P107_1_kind_of_member ?role . ' +
        '    OPTIONAL { ' +
        '        ?evt crm:P4_has_time-span ?join_time_id . ' +
        '        ?join_time_id crm:P82a_begin_of_the_begin ?join_start ; ' +
        '            crm:P82b_end_of_the_end ?join_end . ' +
        '    } ' +
        '    ?id skos:prefLabel ?label . ' +
        '    ?id foaf:familyName ?sname .	' +
        '    OPTIONAL { ?id foaf:firstName ?fname .	} ' +
        '    OPTIONAL { ?id :hasRank ?ranktype . ?ranktype skos:prefLabel ?rank . } ' +
        '} ';

        var byRankQry = prefixes +
        'SELECT DISTINCT ?id ?sname ?fname WHERE {	' +
        '  { ' +
        '  SELECT DISTINCT ?id WHERE { ' +
        '  VALUES ?rank { {0} } . ' +
        '    ?id a atypes:MilitaryPerson .	' +
        '    ?id :hasRank ?rank . ' +
        '  } ' +
        '} UNION { ' +
        'SELECT DISTINCT ?id WHERE { ' +
        '  VALUES ?rank { {0} } . ' +
        '    ?evt a etypes:Promotion .	' +
        '    ?evt :hasRank ?rank . ' +
        '    ?evt crm:P11_had_participant ?id . ' +
        '  	?id a atypes:MilitaryPerson .	' +
        '    } }	' +
        '  ?id foaf:familyName ?sname .	' +
        '  ?id foaf:firstName ?fname . ' +
        '} ORDER BY ?sname ?fname ';

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

        this.getByUnitId = function(id, pageSize) {
            var orderBy = ' ?no ';
            var resultSet = byUnitQryResultSet.format('<{0}>'.format(id));
            var qryObj = queryBuilder.buildQuery(byUnitQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };

        this.getUnitCommanders = function(unitId) {
            var qry = commandersByUnitQry.format('<{0}>'.format(unitId));
            return endpoint.getObjects(qry);
        };

        this.getByRankId = function(id, pageSize) {
            var qry = byRankQry.format('<{0}>'.format(id));
            return endpoint.getObjects(qry, pageSize);
        };

        this.getById = function(id) {
            var resultSet = personQryResultSet.format('<{0}>'.format(id));
            var qryObj = queryBuilder.buildQuery(personQry, resultSet);
            return endpoint.getObjects(qryObj.query).then(function(data) {
                if (data.length) {
                    // because of temporary multiple labels in casualties data set:
                    return data[0];
                }
                return $q.reject('Does not exist');
            });
        };

        this.getByIdList = function(ids, pageSize) {
            if (_.isArray(ids)) {
                ids = '<{0}>'.format(ids.join('> <'));
            } else if (ids) {
                ids = '<{0}>'.format(ids);
            } else {
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
            if ('natiobib' in person ) {
                // Direct link by owl:sameAs
                var qry = nationalBibliographyQry.format(person.natiobib);
                var end2 = new SparqlService('http://ldf.fi/history/sparql');
                return end2.getObjects(qry).then(function(data) {
                    return personMapperService.makeObjectList(data);
                });
            }
            return $q.when();
        };

        this.getItems = function (regx, controller) {
            var qry = selectorQuery.format('{0}'.format(regx));
            controller.items = [ {id:'#', name:'Etsitään ...'} ];
            return endpoint.getObjects(qry).then(function(data) {
                var arr = data;
                if (!arr.length) {
                    arr = [ {id:'#', name:'Ei hakutuloksia.'} ];
                }
                controller.items = arr;
                return arr;
            });
        };
    });
})();
