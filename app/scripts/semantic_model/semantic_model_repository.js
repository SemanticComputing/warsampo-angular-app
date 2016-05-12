(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching arbitrary resources
    * from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('semanticModelRepository', semanticModelRepository);

    function semanticModelRepository($q, AdvancedSparqlService, semanticModelMapperService,
            objectMapperService, QueryBuilderService) {

        /* Public API */

        this.getById = getById;
        this.getRelated = getRelated;

        /* Implementation */

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
        ' SELECT DISTINCT ?id  ?label ?link_label ?type ?type_label ?pred ?pred_label ?obj ' +
        '  ?obj_label ?link { ' +
        '  { ' +
        '   VALUES ?id { {0} }  ' +
        '   OPTIONAL { ' +
        '    ?id a ?type . ' +
        '    OPTIONAL { ?type rdfs:label|skos:prefLabel|skos:altLabel ?type_label . } ' +
        '   } ' +
        '   OPTIONAL { ?id rdfs:label|skos:prefLabel|skos:altLabel ?label . } ' +
        '   OPTIONAL { ' +
        '    ?id ?pred ?obj . ' +
        '    OPTIONAL { ?pred rdfs:label|skos:prefLabel|skos:altLabel ?pred_label . } ' +
        '    OPTIONAL { ?obj rdfs:label|skos:prefLabel|skos:altLabel ?obj_label . } ' +
        '   } ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   { ' +
        '    SELECT DISTINCT ?link { ' +
        '     VALUES ?id { {0} }  ' +
        '     ?o ?link ?id .' +
        '    } ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    FILTER(BOUND(?link)) ' +
        '    ?link skos:prefLabel ?link_label . ' +
        '   } ' +
        '  } ' +
        ' } ';

        var relatedQryResultSet =
        ' ?id {0} {1}  . ' +
        ' OPTIONAL { ?id skos:prefLabel ?label . } ' +
        ' OPTIONAL { ?id rdfs:label ?label . } ' +
        ' OPTIONAL { ?id skos:altLabel ?label . } ';

        var relatedQry = prefixes +
        ' SELECT DISTINCT ?id ?label { ' +
        '  <RESULT_SET> ' +
        '  OPTIONAL { ' +
        '   ?id rdfs:label|skos:prefLabel|skos:altLabel ?lbl . ' +
        '   FILTER(langmatches(lang(?lbl), "FI")) } ' +
        '  OPTIONAL { ?id rdfs:label|skos:prefLabel|skos:altLabel ?lbl . } ' +
        '  BIND(COALESCE(?lbl, REPLACE(STR(?id), "^.+[/#](.+?)$", "$1")) as ?label)' +
        ' } ';

        function getById(id) {
            var qry = byIdQry.format('<' + id + '>');
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Failed to retrieve object with id ' + id);
            });
        }

        function getRelated(id, link) {
            var orderBy = '?label';
            var resultSet = relatedQryResultSet.format('<' + link + '>', '<' + id + '>');
            var qryObj = queryBuilder.buildQuery(relatedQry, resultSet, orderBy);
            return relatedEndpoint.getObjects(qryObj.query, 10, qryObj.resultSetQuery, 5);
        }
    }
})();

