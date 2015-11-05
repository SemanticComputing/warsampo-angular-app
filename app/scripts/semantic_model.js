'use strict';

/*
 * Service that provides an interface for fetching semanticModels from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
    .service('semanticModelService', function($q, SparqlService,
                semanticModelMapperService, SemanticModel) {

        var semanticModelService = this;

        SemanticModel.prototype.fetchRelated = function() {
            var self = this;
            return semanticModelService.getRelated(self.id).then(function(related) {
                if (related.length) {
                    self.related = related;
                    self.hasLinks = true;
                }
            });
        };

        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var prefixes = '' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
            ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ';

        var byIdQry = prefixes +
            ' SELECT DISTINCT ?id  ?label ?type ?type_label?pred ?pred_label ?obj ?obj_label ' +
            ' WHERE { ' +
            '   VALUES ?id { {0} }  ' +
            '   ?id ?pred ?obj . ' +
            '   FILTER(?pred != rdf:type) ' +
            '   ?id a ?type . ' +
            '   OPTIONAL { ?type rdfs:label|skos:prefLabel|skos:altLabel ?type_label . } ' +
            '   OPTIONAL { ?id rdfs:label|skos:prefLabel|skos:altLabel ?label . } ' +
            '   OPTIONAL { ?pred rdfs:label|skos:prefLabel|skos:altLabel ?pred_label . } ' +
            '   OPTIONAL { ?obj rdfs:label|skos:prefLabel|skos:altLabel ?obj_label . } ' +
            ' } ';

        var relatedQry = prefixes +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
            ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
            ' SELECT DISTINCT ?id ?obj ?obj_label (COALESCE(?filabel, ?deflabel, "") AS ?label) ?type ?type_label ?pred ?pred_label ' +
            ' WHERE { ' +
            '   VALUES ?ref { {0} }  ' +
            '   ?obj ?pred ?ref . ' +
            '   FILTER(?pred != rdf:type) ' +
            '   ?obj a ?id . ' +
            '   BIND(?id AS ?type) ' +
            '   OPTIONAL { ' +
            '       ?id rdfs:label|skos:prefLabel|skos:altLabel ?filabel . ' +
            '       FILTER(langmatches(lang(?filabel), "FI")) } ' +
            '   OPTIONAL { ?id rdfs:label|skos:prefLabel|skos:altLabel ?deflabel . } ' +
            '   OPTIONAL { ?obj rdfs:label|skos:prefLabel|skos:altLabel ?obj_label . } ' +
            '   OPTIONAL { ?pred rdfs:label|skos:prefLabel|skos:altLabel ?pred_label . } ' +
            ' } ';

        this.getById = function(id) {
            return endpoint.getObjects(byIdQry.format('<' + id + '>')).then(function(data) {
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

