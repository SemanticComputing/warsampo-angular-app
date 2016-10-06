(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('unitRepository', function($q, _, SparqlService, unitMapperService, SPARQL_ENDPOINT_URL) {

        var endpoint = new SparqlService(SPARQL_ENDPOINT_URL);

        var prefixes =
        ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ';
        ' PREFIX articles: <http://ldf.fi/schema/warsa/articles/> ';

        var unitQry = prefixes +
        '  SELECT DISTINCT ?id ?name ?label ?abbrev ?note ?description ?sid ?source WHERE {  ' +
        '    ?ename a wsc:UnitNaming . ' +
        '    ?ename skos:prefLabel ?name . ' +
        '    BIND(?name AS ?label) ' +
        '    OPTIONAL {?ename skos:altLabel ?abbrev . } ' +
        ' 	 OPTIONAL { ?id dct:source ?sid . ' +
        '      OPTIONAL { ?sid skos:prefLabel ?source . } ' +
        '    } ' +
        '    ?ename crm:P95_has_formed ?id . ' +
        '    OPTIONAL { ?id crm:P3_has_note ?note . } ' +
        '    VALUES ?id  { {0} } ' +
        '    OPTIONAL { ?id dct:description ?description . }	 '+
        '  } ';

        var relatedUnitQry = prefixes +
        'SELECT DISTINCT ?id (SAMPLE(?name) AS ?label) ?level WHERE {  ' +
        '{ SELECT DISTINCT ?id ?level WHERE { ' +
        '                  ?ejoin a wsc:UnitJoining ; ' +
        '                    crm:P143_joined ?unit ; ' +
        '                    crm:P144_joined_with ?id . ' +
        '                BIND (2 AS ?level) ' +
        '      			VALUES ?unit  { {0} } ' +
        '  	} GROUP BY ?id ?level LIMIT 5 ' +
        '} UNION { ' +
        '	SELECT ?id (COUNT(?s) AS ?no) ?level WHERE { ' +
        '					{?ejoin a wsc:UnitJoining ; ' +
        '			                crm:P143_joined ?id ; ' +
        '			                crm:P144_joined_with ?unit . ' +
        '                    BIND (0 AS ?level) ' +
        '			      } UNION { ?ejoin a wsc:UnitJoining ; ' +
        '			                crm:P143_joined ?unit ; ' +
        '			                crm:P144_joined_with ?superunit . ' +
        '			           ?ejoin2 a wsc:UnitJoining ; ' +
        '			                crm:P143_joined ?id ; ' +
        '			                crm:P144_joined_with ?superunit . ' +
        '                BIND (1 AS ?level) ' +
        '	                    FILTER ( ?unit != ?id ) ' +
        '			      } ' +
        '                ?s ?p ?id . ' +
        '                VALUES ?unit  { {0} } ' +
        '    } GROUP BY ?id ?no ?level ORDER BY DESC(?no) LIMIT 50 } ' +
        ' FILTER ( BOUND(?level) ) ' +
        '	?ename a wsc:UnitNaming ; ' +
        '		skos:prefLabel ?name ; ' +
        '		crm:P95_has_formed ?id . ' +
        '} GROUP BY ?id ?label ?level ORDER BY ?name ';

        var byPersonIdQry = prefixes +
        ' SELECT DISTINCT ?id (GROUP_CONCAT(?name; separator = "; ") AS ?label) WHERE { 	' +
        ' VALUES ?person { {0} } . ' +
        '   { ?evt a wsc:PersonJoining ; ' +
        '         crm:P143_joined ?person . ' +
        '         ?evt  crm:P144_joined_with ?id .  ' +
        '    } UNION {  ' +
        '         ?person owl:sameAs ?mennytmies . ' +
        '         ?mennytmies a foaf:Person . ' +
        '         ?mennytmies casualties:osasto ?id .  ' +
        '   } ' +
        '  ?id skos:prefLabel ?name . ' +
        ' } GROUP BY ?id ?label ';

        var subUnitQry = prefixes +
        'SELECT DISTINCT ?id	'+
        'WHERE { 	'+
        '	VALUES ?unit { {0} } 	'+
        '	?unit (^crm:P144_joined_with/crm:P143_joined)+ ?id .	'+
        '	?id a wsc:MilitaryUnit .	'+
        '} GROUP BY ?id ';

        var selectorQuery = prefixes +
        'SELECT DISTINCT ?name ?id  ' +
        'WHERE { ' +
        ' 	{ SELECT DISTINCT ?ename ' +
        ' 	   WHERE { ' +
        ' 	      ?ename a wsc:UnitNaming . ' +
        ' 	      ?ename skos:prefLabel|skos:altLabel|skos:hiddenLabel ?name . ' +
        ' 	      FILTER ( regex(?name, "{0}", "i") ) ' +
        ' 	   } ' +
        ' 	   LIMIT 300 ' +
        ' 	} ?ename skos:prefLabel ?name ; crm:P95_has_formed ?id . ' +
        '} ORDER BY lcase(?name) ' ;

        var actorInfoQry = prefixes +
        ' SELECT ?id ?type ?label ?familyName ?firstName ' +
        ' FROM <http://ldf.fi/warsa/actors> ' +
        ' FROM <http://ldf.fi/warsa/actors/actor_types> ' +
        ' FROM NAMED <http://ldf.fi/warsa/events> ' +
        ' WHERE { ' +
        '   VALUES ?id { {0} } ' +
        '   ?id ' +
        '       a ?type ; ' +
        '       skos:prefLabel ?label . ' +
        '   OPTIONAL { ?id ' +
        '       foaf:familyName ?familyName ; ' +
        '       foaf:firstName ?firstName . ' +
        '   } ' +
        ' } ';

        var wardiaryQry = prefixes +
        'SELECT ?label ?id ?time	' +
        'WHERE {	' +
        '  GRAPH <http://ldf.fi/warsa/diaries> {	' +
        '    VALUES ?unit { {0} } .	' +
        '    ?uri crm:P70_documents ?unit .	' +
        '    ?uri skos:prefLabel ?label .	' +
        '    ?uri dct:hasFormat ?id .	' +
        '    OPTIONAL { ?uri crm:P4_has_time-span ?time . }	' +
        '    }	' +
        '} ORDER BY ?time	';

        var wikipediaQry = prefixes +
        'SELECT ?id	' +
        'WHERE {	' +
        '    VALUES ?unit { {0} } .	' +
        '    ?unit foaf:page ?id .	' +
        '} ';

        var articleQry = prefixes +
        'SELECT ?id ?label ' +
        'WHERE { ' +
        '  GRAPH <http://ldf.fi/warsa/articles> { ' +
        '  VALUES ?unit { {0} } .  ' +
        '  ?id a wsc:Article ; ' +
        '      dct:title ?label ;  ' +
        '      wsc:nerunit ?unit .  ' +
        '  } ' +
        '} ORDER BY ?label ';

        this.getById = function(id) {
            var qry = unitQry.format('<{0}>'.format(id));
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return unitMapperService.makeObjectList(data)[0];
                }
                return $q.reject('Does not exist');
            });
        };

        this.getByIdList = function(ids) {
            if (_.isArray(ids)) {
                ids = '<{0}>'.format(ids.join('> <'));
            } else if (ids) {
                ids = '<{0}>'.format(ids);
            } else {
                return $q.when();
            }
            var qry = unitQry.format(ids);
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectList(data);
            });
        };

        this.getByPersonId = function(id) {
            if (_.isArray(id)) {
                id = '<{0}>'.format(id.join('> <'));
            } else if (id) {
                id = '<{0}>'.format(id);
            } else {
                return $q.when(null);
            }
            var qry = byPersonIdQry.format(id);
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectList(data);
            });
        };

        this.getRelatedUnits = function(unit) {
            var qry = relatedUnitQry.format('<{0}>'.format(unit));
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectList(data);
            });
        };

        this.getSubUnits = function(unit) {
            var qry = subUnitQry.format('<{0}>'.format(unit));
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectList(data);
            });
        };

        this.getItems = function(regx) {
            var qry = selectorQuery.format('{0}'.format(regx));
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectListNoGrouping(data);
            });
        };

        this.getActorInfo = function(ids) {
            var qry;
            if (_.isArray(ids)) {
                ids = '<{0}>'.format(ids.join('> <'));
            } else if (ids) {
                ids = '<{0}>'.format(ids);
            } else {
                return $q.when(null);
            }
            qry = actorInfoQry.format(ids);
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectList(data);
            });
        };

        this.getUnitDiaries = function(unit) {
            var qry = wardiaryQry.format('<{0}>'.format(unit));
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectListNoGrouping(data);
            });
        };

        this.getUnitWikipedia = function(unit) {
            var qry = wikipediaQry.format('<{0}>'.format(unit));
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectListNoGrouping(data);
            });
        };

        this.getUnitArticles = function(unit) {
            var qry = articleQry.format('<{0}>'.format(unit));
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectListNoGrouping(data);
            });
        };

    });
})();
