'use strict';
/* eslint-disable angular/no-service-method */

/*
 * Service that provides an interface for fetching arbitrary resources
 * from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
.service('semanticModelRepository', function($q, AdvancedSparqlService,
            semanticModelMapperService, objectMapperService, QueryBuilderService) {

    var endpoint = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
            semanticModelMapperService);

    var relatedEndpoint = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
            objectMapperService);

    var prefixes =
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ';

    var queryBuilder = new QueryBuilderService(prefixes);

    var byIdQry = prefixes +
        ' SELECT DISTINCT ?id  ?label ?type ?type_label ?pred ?pred_label ?obj ' +
        '   ?obj_label ?link' +
        ' WHERE { ' +
        '   VALUES ?id { {0} }  ' +
        '   ?id ?pred ?obj . ' +
        '   ?id a ?type . ' +
        '   { ' +
        '    SELECT DISTINCT ?link { ' +
        '     VALUES ?id { {0} }  ' +
        '     ?o ?link ?id .' +
        '    } ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    FILTER(BOUND(?link)) ' +
        '    ?link skos:prefLabel ?link_lbl . ' +
        '   } ' +
        '   BIND(COALESCE(?link_lbl, REPLACE(STR(?link), "^.+/(.+?)$", "$1")) as ?link_label)' +
        '   OPTIONAL { ?type rdfs:label|skos:prefLabel|skos:altLabel ?type_label . } ' +
        '   OPTIONAL { ?id rdfs:label|skos:prefLabel|skos:altLabel ?label . } ' +
        '   OPTIONAL { ?pred rdfs:label|skos:prefLabel|skos:altLabel ?pred_label . } ' +
        '   OPTIONAL { ?obj rdfs:label|skos:prefLabel|skos:altLabel ?obj_label . } ' +
        ' } ';

    var relatedQryResultSet =
        '   VALUES ?ref { {0} }  ' +
        '   VALUES ?pred { {1} }  ' +
        '   ?id ?pred ?ref . ';

    var relatedQry = prefixes +
        ' SELECT DISTINCT ?id ?label { ' +
        '  <RESULT_SET> ' +
        '  OPTIONAL { ' +
        '   ?id rdfs:label|skos:prefLabel|skos:altLabel ?lbl . ' +
        '   FILTER(langmatches(lang(?lbl), "FI")) } ' +
        '  OPTIONAL { ?id rdfs:label|skos:prefLabel|skos:altLabel ?lbl . } ' +
        '  BIND(COALESCE(?lbl, REPLACE(STR(?id), "^.+/(.+?)$", "$1")) as ?label)' +
        ' } ';

    this.getById = function(id) {
        var qry = byIdQry.format('<' + id + '>');
        return endpoint.getObjects(qry).then(function(data) {
            if (data.length) {
                return data[0];
            }
            return $q.reject('Failed to get SemanticModel');
        });
    };

    this.getRelated = function(id, link) {
        var resultSet = relatedQryResultSet.format('<' + id + '>', '<' + link + '>');
        var qryObj = queryBuilder.buildQuery(relatedQry, resultSet);
        return relatedEndpoint.getObjects(qryObj.query, 10, qryObj.resultSetQuery);
    };
});

