(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching arbitrary resources
    * from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('semanticModelRepository', semanticModelRepository);

    function semanticModelRepository($q, _, AdvancedSparqlService, semanticModelMapperService,
        objectMapperService, translateableObjectMapperService, QueryBuilderService,
        ENDPOINT_CONFIG, DBPEDIA_ENDPOINT_CONFIG, DBPEDIA_FI_ENDPOINT_CONFIG, baseRepository) {

        /* Public API */

        this.getById = getById;
        this.getRelated = getRelated;

        /* Implementation */

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, semanticModelMapperService);
        var dbpediaEndpoint = new AdvancedSparqlService(DBPEDIA_ENDPOINT_CONFIG,
            semanticModelMapperService);
        var dbpediaFiEndpoint = new AdvancedSparqlService(DBPEDIA_FI_ENDPOINT_CONFIG,
            semanticModelMapperService);

        var relatedEndpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, translateableObjectMapperService);
        var relatedDbPediaEndpoint = new AdvancedSparqlService(DBPEDIA_ENDPOINT_CONFIG, translateableObjectMapperService);

        var prefixes =
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var byIdQry = prefixes +
        ' SELECT DISTINCT ?id  ?label ?link ?link_label ?type ?type_label ?pred ?pred_label ?obj ?obj_label { ' +
        '  { ' +
        '    VALUES ?id { <ID> } ' +
        '    ?id a ?type_id . ' +
        '    OPTIONAL { ?type_id rdfs:label|skos:prefLabel ?type . } ' +
        '  } UNION { ' +
        '    VALUES ?id { <ID> } ' +
        '    ?id rdfs:label|skos:prefLabel ?label . ' +
        '  } UNION { ' +
        '    VALUES ?id { <ID> } ' +
        '    ?id ?pred ?obj . ' +
        '    FILTER(?pred != rdf:type) ' +
        '    OPTIONAL { ?pred rdfs:label|skos:prefLabel ?pred_label . } ' +
        '    OPTIONAL { ?obj rdfs:label|skos:prefLabel ?obj_label . } ' +
        '  } UNION { ' +
        '    VALUES ?id { <ID> } ' +
        '    ?o ?link ?id . ' +
        '    OPTIONAL { ?link rdfs:label|skos:prefLabel ?link_label . } ' +
        '  } ' +
        ' } ';

        var relatedQryResultSet =
        ' ?id <LINK> <ID> . ' +
        ' OPTIONAL { ?id skos:prefLabel ?label . } ' +
        ' OPTIONAL { ?id rdfs:label ?label . } ' +
        ' OPTIONAL { ?id skos:altLabel ?label . } ';

        var relatedQry = prefixes +
        ' SELECT DISTINCT ?id ?label { ' +
        '  <RESULT_SET> ' +
        '  OPTIONAL { ' +
        '   ?id rdfs:label ?lbl . ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id skos:prefLabel ?lbl . ' +
        '  } ' +
        '  BIND(COALESCE(?lbl, REPLACE(STR(?id), "^.+[/#](.+?)$", "$1")) as ?label)' +
        ' } ';

        function getById(id) {
            var qry = byIdQry.replace(/<ID>/g, baseRepository.uriFy(id));
            var ep;
            if (id.match('fi.dbpedia.org')) {
                ep = dbpediaFiEndpoint;
            } else {
                ep = id.match('dbpedia.org') ? dbpediaEndpoint : endpoint;
            }
            return ep.getObjects(qry).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Failed to retrieve object with id ' + id);
            });
        }

        function getRelated(id, link) {
            id = baseRepository.uriFy(id);
            link = baseRepository.uriFy(link);
            var orderBy = '?label';
            var resultSet = relatedQryResultSet.replace(/<ID>/g, id).replace(/<LINK>/g, link);
            var qryObj = queryBuilder.buildQuery(relatedQry, resultSet, orderBy);
            return relatedEndpoint.getObjects(qryObj.query, 10, qryObj.resultSetQuery, 5).then(function(data) {
                return data.getTotalCount().then(function(count) {
                    return count ? data : relatedDbPediaEndpoint.getObjects(qryObj.query, 10, qryObj.resultSetQuery, 5);
                });
            });
        }
    }
})();

