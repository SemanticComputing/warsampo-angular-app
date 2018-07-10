(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('unitRepository', function($q, AdvancedSparqlService, baseRepository,
            unitMapperService, QueryBuilderService, ENDPOINT_CONFIG) {

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, unitMapperService);

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX wars: <http://ldf.fi/schema/warsa/articles/> ' +
        ' PREFIX wcsc: <http://ldf.fi/schema/warsa/casualties/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ' +
        ' PREFIX wacs: <http://ldf.fi/schema/warsa/actors/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var select =
        ' SELECT DISTINCT ?id ?label ?abbrev ?altName ?note ?description ' +
        '  ?sid ?source ?level ?wikilink';

        var conflictPart =
        '   OPTIONAL { ' +
        '     SELECT DISTINCT ?id (GROUP_CONCAT(DISTINCT ?conf; separator=", ") AS ?conflict) ?confLang { ' +
        '      ?id wacs:hasConflict/skos:prefLabel ?conf . ' +
        '      BIND(LANG(?conf) AS ?confLang) ' +
        '     } GROUP BY ?id ?confLang ' +
        '   } ' +
        '   BIND (IF(bound(?conflict), STRLANG(CONCAT(?preflabel," (", ?conflict, ")"), ?confLang), ?preflabel) AS ?label)  ';

        var unitByIdQry = prefixes + select +
        ' { ' +
        '   <RESULT_SET> ' +
        '   ?id a/rdfs:subClassOf* wsc:Group ; skos:prefLabel ?preflabel . ' +
        '   OPTIONAL { ?id skos:altLabel ?abbrev . } ' +
        '   OPTIONAL { ' +
        '    ?id (crm:P95i_was_formed_by|^crm:P95_has_formed) ?naming . ' +
        '    ?naming a wsc:UnitNaming ; skos:prefLabel ?altName . ' +
        '    FILTER(STR(?altName) != STR(?preflabel)) ' +
        '   } ' +
        '   OPTIONAL { ?id dct:source ?sid . ' +
        '     OPTIONAL { ?sid skos:prefLabel ?source . } ' +
        '   } ' +
        '   OPTIONAL { ?id crm:P3_has_note ?note . } ' +
        '   OPTIONAL { ?id dct:description ?description . }  ' +
        '   OPTIONAL { ?id foaf:page ?wikilink . } ' +
            conflictPart +
        ' } ';

        var relatedUnitQry = prefixes +
        ' SELECT DISTINCT  ?id ?level ?label { ' +
        ' { ' +
        '  SELECT DISTINCT ?id ?level WHERE { ' +
        '    VALUES ?unit  { <ACTOR> } ' +
        '    { ' +
        '      ?unit (^crm:P143_joined/crm:P144_joined_with) ?id .  ' +
        '      BIND (2 AS ?level)  ' +
        '    } UNION {  ' +
        '      ?unit (^crm:P143_joined/crm:P144_joined_with){2} ?id .  ' +
        '      BIND (3 AS ?level)  ' +
        '    } UNION {  ' +
        '      ?unit (^crm:P143_joined/crm:P144_joined_with){3} ?id .  ' +
        '      BIND (4 AS ?level)  ' +
        '    } UNION {  ' +
        '      ?unit (^crm:P143_joined/crm:P144_joined_with){4} ?id .  ' +
        '      BIND (5 AS ?level)  ' +
        '    } UNION {  ' +
        '      ?unit (^crm:P143_joined/crm:P144_joined_with){5} ?id .  ' +
        '      BIND (6 AS ?level)  ' +
        '    } UNION {  ' +
        '      ?unit (^crm:P143_joined/crm:P144_joined_with){6} ?id .  ' +
        '      BIND (7 AS ?level)  ' +
        '    } UNION {  ' +
        '      ?unit (^crm:P143_joined/crm:P144_joined_with){7} ?id .  ' +
        '      BIND (8 AS ?level)  ' +
        '    } ' +
        '  } GROUP BY ?id ?level LIMIT 10  ' +
        ' } UNION {  ' +
        '   SELECT ?id (COUNT(?s) AS ?no) ?level  WHERE {  ' +
        '     VALUES ?unit  { <ACTOR> }  ' +
        '     { ' +
        '       ?unit ^crm:P144_joined_with/crm:P143_joined ?id .  ' +
        '       BIND (0 AS ?level)  ' +
        '     } UNION {  ' +
        '       ?unit ^crm:P143_joined/crm:P144_joined_with/^crm:P144_joined_with/crm:P143_joined ?id . ' +
        '       BIND (1 AS ?level) ' +
        '       FILTER ( ?unit != ?id ) ' +
        '     } ' +
        '     ?id a/rdfs:subClassOf* wsc:Group . ' +
        '     ?s ?p ?id . ' +
        '     FILTER ( BOUND(?level) )  ' +
        '   } GROUP BY ?id ?level ORDER BY DESC(?no) LIMIT 50 ' +
        ' }  ' +
        ' FILTER BOUND(?id) ' +
        ' ?id skos:prefLabel ?preflabel . ' +
          conflictPart +
        ' } ';

        var byPersonIdQry = prefixes + select +
        ' { ' +
        '   VALUES ?person { <PERSON> } . ' +
        '   ?person ^crm:P143_joined/crm:P144_joined_with ?id . ' +
        '   ?id a/rdfs:subClassOf* wsc:Group ; skos:prefLabel ?preflabel . ' +
        '   OPTIONAL { ?id foaf:page ?wikilink . } ' +
            conflictPart +
        ' } ';

        var byCemeteryIdQryResultSet =
        '   SELECT DISTINCT ?id (COUNT(?id) as ?unit_count) { ' +
        '     VALUES ?cemetery { <CEMETERY> } . ' +
        '     ?death_record wsc:buried_in ?cemetery . ' +
        '     ?death_record wcsc:unit ?id . ' +
        '   } ' +
        '   GROUP BY ?id ';

        var selectorQuery = prefixes +
        'SELECT DISTINCT ?id ?label {  ' +
        ' { ' +
        '  SELECT DISTINCT ?id ' +
        '    WHERE { ' +
        '      VALUES ?nclass { wsc:UnitNaming wsc:Formation wsc:Group wsc:MilitaryUnit } ' +
        '      ?evt a ?nclass ;  ' +
        '         skos:prefLabel|skos:altLabel ?label .  ' +
        '      FILTER (regex(?label,"<REGEX>","i"))  ' +
        '      ?evt ^crm:P95i_was_formed_by|crm:P95_has_formed ?id . ' +
        '      ?id a/rdfs:subClassOf* wsc:Group . ' +
        '      <ADDITIONAL_FILTER> ' +
        '  } LIMIT 50 ' +
        ' } ' +
        ' ?id skos:prefLabel ?preflabel . ' +
          conflictPart +
        '} GROUP BY ?id ?label ORDER BY lcase(?label) ';

        // Units that have (or their subunits have) participated in battles
        var selectorEventFilter =
        ' ?id (^crm:P144_joined_with/crm:P143_joined)* [ ' +
        '    a/rdfs:subClassOf* wsc:Group ; ' +
        '    ^crm:P11_had_participant [ ' +
        '      crm:P4_has_time-span [] ; ' +
        '      a wsc:Battle ' +
        '   ] ' +
        ' ] . ';

        var wardiaryQry = prefixes +
        'SELECT ?label ?id ?time ' +
        'WHERE { ' +
        '  GRAPH <http://ldf.fi/warsa/diaries> { ' +
        '    VALUES ?unit { <ID> } . ' +
        '    ?uri crm:P70_documents ?unit . ' +
        '    ?uri skos:prefLabel ?label . ' +
        '    ?uri dct:hasFormat ?id . ' +
        '    OPTIONAL { ?uri crm:P4_has_time-span ?time . } ' +
        '    } ' +
        '} ORDER BY ?time ';

        var articleQry = prefixes +
        'SELECT ?id ?label ' +
        'WHERE { ' +
        '  GRAPH <http://ldf.fi/warsa/articles> { ' +
        '  VALUES ?unit { <ID> } .  ' +
        '  ?id a wsc:Article ; ' +
        '      dc:title|dct:title ?label ;  ' +
        '      wars:nerunit ?unit .  ' +
        '  } ' +
        '} ORDER BY ?label ';

        this.getByIdList = function(ids, options) {
            options = options || {};
            ids = baseRepository.uriFy(ids);
            if (!ids) {
                return $q.when();
            }
            var resultSet = 'VALUES ?id { ' + ids + ' }';
            var qryObj = queryBuilder.buildQuery(unitByIdQry, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery).then(function(data) {
                if (data.length) {
                    return data;
                }
                return $q.reject('Does not exist');
            });
        };

        this.getById = this.getByIdList;

        this.getByPersonId = function(id) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = byPersonIdQry.replace('<PERSON>', id);
            return endpoint.getObjects(qry);
        };

        this.getByCemeteryId = function(id, pageSize) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = byCemeteryIdQryResultSet.replace('<CEMETERY>', id);
            var qryObj = queryBuilder.buildQuery(unitByIdQry, resultSet, 'DESC(?unit_count)');
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        };

        this.getRelatedUnits = function(unit) {
            unit = baseRepository.uriFy(unit);
            var qry = relatedUnitQry.replace(/<ACTOR>/g, unit);
            return endpoint.getObjects(qry);
        };

        this.getItems = function(regx, withEventsOnly) {
            var qry = selectorQuery.replace('<ADDITIONAL_FILTER>',
                withEventsOnly ? selectorEventFilter : '');
            qry = qry.replace('<REGEX>', regx);
            return endpoint.getObjects(qry);
        };

        this.getUnitDiaries = function(unit) {
            unit = baseRepository.uriFy(unit);
            var qry = wardiaryQry.replace('<ID>', unit);
            return endpoint.getObjectsNoGrouping(qry);
        };

        this.getUnitArticles = function(unit) {
            unit = baseRepository.uriFy(unit);
            var qry = articleQry.replace('<ID>', unit);
            return endpoint.getObjectsNoGrouping(qry);
        };
    });
})();
