(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('unitRepository', function($q, AdvancedSparqlService, baseRepository,
            unitMapperService, ENDPOINT_CONFIG) {

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, unitMapperService);

        var prefixes =
        ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> ' +
        ' PREFIX articles: <http://ldf.fi/schema/warsa/articles/> ';

        var select =
        ' SELECT DISTINCT ?id ?name ?label ?abbrev ?note ?description ' +
        '  ?sid ?source ?level ';

        var unitByIdQry = prefixes + select +
        ' { ' +
        '   ?ename a etypes:UnitNaming . ' +
        '   ?ename skos:prefLabel ?name . ' +
        '   BIND(?name AS ?label) ' +
        '   OPTIONAL {?ename skos:altLabel ?abbrev . } ' +
        '   OPTIONAL { ?id dc:source ?sid . ' +
        '     OPTIONAL { ?sid skos:prefLabel ?source . } ' +
        '   } ' +
        '   ?ename crm:P95_has_formed ?id . ' +
        '   OPTIONAL { ?id crm:P3_has_note ?note . } ' +
        '   VALUES ?id  { <ID> } ' +
        '   OPTIONAL { ?id dc:description ?description . }  '+
        ' } ';

        var relatedUnitQry = prefixes +
        ' SELECT DISTINCT  ?id ?level (SAMPLE(?name) AS ?label) WHERE { ' +
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
        '     ?id a atypes:MilitaryUnit . ' +
        '     ?s ?p ?id . ' +
        '     FILTER ( BOUND(?level) )  ' +
        '   } GROUP BY ?id ?level ORDER BY DESC(?no) LIMIT 50 ' +
        ' }  ' +
        ' ?ename a etypes:UnitNaming ; ' +
        '   skos:prefLabel ?name ; ' +
        '   crm:P95_has_formed ?id . ' +
        ' } GROUP BY ?id ?level ORDER BY ?level ';

        var byPersonIdQry = prefixes +
        ' SELECT DISTINCT ?id (GROUP_CONCAT(?name; separator = "; ") AS ?label) WHERE {  ' +
        ' VALUES ?person { <PERSON> } . ' +
        '   { ?evt a etypes:PersonJoining ; ' +
        '         crm:P143_joined ?person . ' +
        '         ?evt  crm:P144_joined_with ?id .  ' +
        '    } UNION {  ' +
        '         ?person owl:sameAs ?mennytmies . ' +
        '         ?mennytmies a foaf:Person . ' +
        '         ?mennytmies casualties:osasto ?id .  ' +
        '   } ' +
        '  ?id skos:prefLabel ?name . ' +
        ' } GROUP BY ?id ?label ';

        var selectorQuery = prefixes +
        'SELECT DISTINCT ?name ?id  ' +
        'WHERE { ' +
        '  { SELECT DISTINCT ?ename ' +
        '     WHERE { ' +
        '        ?ename a etypes:UnitNaming . ' +
        '        ?ename skos:prefLabel|skos:altLabel|skos:hiddenLabel ?name . ' +
        '        FILTER ( regex(?name, "<REGEX>", "i") ) ' +
        '     } ' +
        '     LIMIT 300 ' +
        '  } ?ename skos:prefLabel ?name ; crm:P95_has_formed ?id . ' +
        '} ORDER BY lcase(?name) ' ;

        var wardiaryQry = prefixes +
        'SELECT ?label ?id ?time ' +
        'WHERE { ' +
        '  GRAPH <http://ldf.fi/warsa/diaries> { ' +
        '    VALUES ?unit { <ID> } . ' +
        '    ?uri crm:P70_documents ?unit . ' +
        '    ?uri skos:prefLabel ?label . ' +
        '    ?uri <http://purl.org/dc/terms/hasFormat> ?id . ' +
        '    OPTIONAL { ?uri crm:P4_has_time-span ?time . } ' +
        '    } ' +
        '} ORDER BY ?time ';

        var wikipediaQry = prefixes +
        'SELECT ?id ' +
        'WHERE { ' +
        '    VALUES ?unit { <ID> } . ' +
        '    ?unit foaf:page ?id . ' +
        '} ';

        var articleQry = prefixes +
        'SELECT ?id ?label ' +
        'WHERE { ' +
        '  GRAPH <http://ldf.fi/warsa/articles> { ' +
        '  VALUES ?unit { <ID> } .  ' +
        '  ?id a articles:Article ; ' +
        '      <http://purl.org/dc/elements/1.1/title> ?label ;  ' +
        '      articles:nerunit ?unit .  ' +
        '  } ' +
        '} ORDER BY ?label ';

        this.getById = function(id) {
            id = baseRepository.uriFy(id);
            var qry = unitByIdQry.replace('<ID>', id);
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Does not exist');
            });
        };

        this.getByIdList = function(ids) {
            ids = baseRepository.uriFy(ids);
            if (!ids) {
                return $q.when();
            }
            var qry = unitByIdQry.replace('<ID>', ids);
            return endpoint.getObjects(qry);
        };

        this.getByPersonId = function(id) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = byPersonIdQry.replace('<PERSON>', id);
            return endpoint.getObjects(qry);
        };

        this.getRelatedUnits = function(unit) {
            unit = baseRepository.uriFy(unit);
            var qry = relatedUnitQry.replace(/<ACTOR>/g, unit);
            return endpoint.getObjects(qry);
        };

        this.getItems = function(regx) {
            var qry = selectorQuery.replace('<REGEX>', regx);
            return endpoint.getObjects(qry);
        };

        this.getUnitDiaries = function(unit) {
            unit = baseRepository.uriFy(unit);
            var qry = wardiaryQry.replace('<ID>', unit);
            return endpoint.getObjectsNoGrouping(qry);
        };

        this.getUnitWikipedia = function(unit) {
            unit = baseRepository.uriFy(unit);
            var qry = wikipediaQry.replace('<ID>', unit);
            return endpoint.getObjectsNoGrouping(qry);
        };

        this.getUnitArticles = function(unit) {
            unit = baseRepository.uriFy(unit);
            var qry = articleQry.replace('<ID>', unit);
            return endpoint.getObjectsNoGrouping(qry);
        };
    });
})();
