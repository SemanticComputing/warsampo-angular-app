'use strict';

/*
 * Service that provides an interface for fetching semanticModels from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
    .service('semanticModelRepository', function($q, SparqlService,
                semanticModelMapperService) {

        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var prefixes = '' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
            ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ';

        var byIdQry = prefixes +
            ' SELECT DISTINCT ?id  ?label ?type ?type_label ?pred ?pred_label ?obj ?obj_label ' +
            ' WHERE { ' +
            '   VALUES ?id { {0} }  ' +
            '   ?id ?pred ?obj . ' +
            '   ?id a ?type . ' +
            '   OPTIONAL { ?type rdfs:label|skos:prefLabel|skos:altLabel ?type_label . } ' +
            '   OPTIONAL { ?id rdfs:label|skos:prefLabel|skos:altLabel ?label . } ' +
            '   OPTIONAL { ?pred rdfs:label|skos:prefLabel|skos:altLabel ?pred_label . } ' +
            '   OPTIONAL { ?obj rdfs:label|skos:prefLabel|skos:altLabel ?obj_label . } ' +
            ' } ';

        var relatedQry = prefixes +
            ' SELECT DISTINCT ?id ?obj ?obj_label  ' +
            '       ?obj_type (COALESCE(?filabel, ?deflabel) AS ?label) ' +
            '       ?type (COALESCE(?fi_pred_label, ?def_pred_label) AS ?pred_label) ?pred ' +
            ' WHERE { ' +
            '   VALUES ?ref { {0} }  ' +
            '   ?obj ?id ?ref . ' +
            '   ?obj a ?pred . ' +
            '   BIND(rdf:Property AS ?type) ' +
            '   OPTIONAL { ' +
            '       ?id rdfs:label|skos:prefLabel|skos:altLabel ?filabel . ' +
            '       FILTER(langmatches(lang(?filabel), "FI")) } ' +
            '   OPTIONAL { ?id rdfs:label|skos:prefLabel|skos:altLabel ?deflabel . } ' +
            '   OPTIONAL { ?obj rdfs:label|skos:prefLabel|skos:altLabel ?obj_label . } ' +
            '   OPTIONAL { ?pred rdfs:label|skos:prefLabel|skos:altLabel ?fi_pred_label .  ' +
            '       FILTER(langmatches(lang(?fi_pred_label), "FI")) } ' +
            '   OPTIONAL { ?pred rdfs:label|skos:prefLabel|skos:altLabel ?def_pred_label . } ' +
            ' } ';

        this.getById = function(id) {
            var qry = byIdQry.format('<' + id + '>');
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return semanticModelMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Failed to get SemanticModel");
            });
        };

        this.getRelated = function(id) {
            var qry = relatedQry.format('<' + id + '>');
            return endpoint.getObjects(qry).then(function(data) {
                return semanticModelMapperService.makeObjectList(data);
            });
        };
});

