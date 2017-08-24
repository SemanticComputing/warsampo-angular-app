(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching arbitrary resources
    * from the WarSampo or DBpedia SPARQL endpoints.
    */
    angular.module('eventsApp')
    .service('semanticModelRepository', semanticModelRepository);

    function semanticModelRepository($q, _, AdvancedSparqlService, semanticModelMapperService,
        objectMapperService, translateableObjectMapperService, QueryBuilderService,
        ENDPOINT_CONFIG, DBPEDIA_ENDPOINT_CONFIG, DBPEDIA_FI_ENDPOINT_CONFIG, baseRepository) {

        /* Public API */

        this.getById = getById;
        this.getLinksById = getLinksById;
        this.getRelated = getRelated;
        this.getRelatedWarsa = getRelatedWarsa;
        this.getRelatedDbpedia = getRelatedDbpedia;
        this.getRelatedDbpediaFi = getRelatedDbpediaFi;

        /* Implementation */

        var warsaEndpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, semanticModelMapperService);
        var dbpediaEndpoint = new AdvancedSparqlService(DBPEDIA_ENDPOINT_CONFIG,
            semanticModelMapperService);
        var dbpediaFiEndpoint = new AdvancedSparqlService(DBPEDIA_FI_ENDPOINT_CONFIG,
            semanticModelMapperService);

        var relatedWarsaEndpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, translateableObjectMapperService);
        var relatedDbPediaEndpoint = new AdvancedSparqlService(DBPEDIA_ENDPOINT_CONFIG, translateableObjectMapperService);
        var relatedDbPediaFiEndpoint = new AdvancedSparqlService(DBPEDIA_FI_ENDPOINT_CONFIG, translateableObjectMapperService);

        var prefixes =
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var byIdQry = prefixes +
        ' SELECT DISTINCT ?id  ?label ?link ?link_label ?type_id ?type_label ?pred ?pred_label ?obj ?obj_label { ' +
        '  { ' +
        '    VALUES ?id { <ID> } ' +
        '    ?id rdfs:label|skos:prefLabel ?label . ' +
        '  } UNION { ' +
        '    VALUES ?id { <ID> } ' +
        '    ?id ?pred ?obj . ' +
        '    OPTIONAL { ?pred rdfs:label|skos:prefLabel ?pred_label . } ' +
        '    OPTIONAL { ?obj rdfs:label|skos:prefLabel ?obj_label . } ' +
        '  } ' +
        ' } ';

        var linkQry = prefixes +
        ' SELECT DISTINCT ?id ?label { ' +
        '  VALUES ?res { <ID> } ' +
        '  [] ?id ?res . ' +
        '  OPTIONAL { ?id rdfs:label ?lbl . } ' +
        '  OPTIONAL { ?id skos:prefLabel ?lbl . } ' +
        '  BIND(COALESCE(?lbl, REPLACE(REPLACE(STR(?id), "^.+[/#](.+?)$", "$1"), "_", " ")) as ?label) ' +
        ' } ';

        var relatedQryResultSet =
        ' ?id <LINK> <ID> . ' +
        ' OPTIONAL { ?id skos:prefLabel ?label . } ' +
        ' OPTIONAL { ?id rdfs:label ?label . } ' +
        ' OPTIONAL { ?id skos:altLabel ?label . } ';

        var relatedQry = prefixes +
        ' SELECT DISTINCT ?id ?label { ' +
        '  <RESULT_SET> ' +
        '  OPTIONAL { ?id rdfs:label ?lbl . } ' +
        '  OPTIONAL { ?id skos:prefLabel ?lbl . } ' +
        '  BIND(COALESCE(?lbl, REPLACE(REPLACE(STR(?id), "^.+[/#](.+?)$", "$1"), "_", " ")) as ?label) ' +
        ' } ';

        function getById(id) {
            var qry = byIdQry.replace(/<ID>/g, baseRepository.uriFy(id));
            var ep;
            if (id.match('fi.dbpedia.org')) {
                ep = dbpediaFiEndpoint;
            } else {
                ep = id.match('dbpedia.org') ? dbpediaEndpoint : warsaEndpoint;
            }
            return ep.getObjects(qry).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Failed to retrieve object with id ' + id);
            });
        }

        function getLinksById(id) {
            var qry = linkQry.replace(/<ID>/g, baseRepository.uriFy(id));
            return $q.all([relatedWarsaEndpoint.getObjects(qry),
                relatedDbPediaEndpoint.getObjects(qry),
                relatedDbPediaFiEndpoint.getObjects(qry)]);
        }

        function getRelatedWarsa(id, link) {
            return this.getRelated(id, link, relatedWarsaEndpoint);
        }

        function getRelatedDbpedia(id, link) {
            return this.getRelated(id, link, relatedDbPediaEndpoint);
        }

        function getRelatedDbpediaFi(id, link) {
            return this.getRelated(id, link, relatedDbPediaFiEndpoint);
        }

        function getRelated(id, link, endpoint) {
            id = baseRepository.uriFy(id);
            link = baseRepository.uriFy(link);
            var orderBy = '?label';
            var resultSet = relatedQryResultSet.replace(/<ID>/g, id).replace(/<LINK>/g, link);
            var qryObj = queryBuilder.buildQuery(relatedQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, 10, qryObj.resultSetQuery, 5);
        }
    }
})();

