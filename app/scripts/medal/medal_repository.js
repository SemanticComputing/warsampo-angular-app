(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('medalRepository', function($q, AdvancedSparqlService, QueryBuilderService,
        baseRepository, medalMapperService, ENDPOINT_CONFIG) {

        this.getById = getById;
        this.getByPersonId = getByPersonId;
        this.getRelatedMedals = getRelatedMedals;

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, medalMapperService);

        var prefixes =
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var medalQryResultSet =
        '  VALUES ?id { <ID> } .   ' +
        '  ?id a wsc:Medal . ' +
        '  ?id skos:prefLabel ?label . ' +
        '  ?id a/skos:prefLabel ?type . ';

        var medalQry = prefixes +
        ' SELECT DISTINCT ?id ?label ?description WHERE {  ' +
        '  <RESULT_SET> ' +
        '  ?id skos:prefLabel ?label . ' +
        '  ?id a/skos:prefLabel ?type . ' +
        '  OPTIONAL { ?id dct:description ?description . } ' +
        ' } ';

        var byPersonQryResultSet =
        ' ?evt crm:P141_assigned ?id ; ' +
        '   crm:P11_had_participant <ID>; ' +
        '   a wsc:MedalAwarding . ';

        var relatedMedalQry = prefixes +
        ' SELECT DISTINCT ?id ?label WHERE {  ' +
        '  { ' +
        '   SELECT DISTINCT ?id (COUNT(?actor) AS ?no) WHERE {  ' +
        '    VALUES ?medal { <ID> } .  ' +
        '    { ' +
        '     SELECT DISTINCT ?actor { ' +
        '      VALUES ?medal { <ID> } .  ' +
        '      ?evt crm:P141_assigned ?medal ; ' +
        '        crm:P11_had_participant ?actor ; ' +
        '        a wsc:MedalAwarding . ' +
        '     } LIMIT 50 ' +
        '    } ' +
        '    ?evt2 crm:P11_had_participant ?actor ; ' +
        '      crm:P141_assigned ?id ; ' +
        '      a wsc:MedalAwarding . ' +
        '    FILTER (?medal != ?id) ' +
        '   } GROUP BY ?id ' +
        '  } ' +
        '  ?id skos:prefLabel ?label . ' +
        ' } ORDER BY desc(?no) ';

        function getById(id) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = medalQryResultSet.replace(/<ID>/g, id);
            var qryObj = queryBuilder.buildQuery(medalQry, resultSet);
            return endpoint.getObjects(qryObj.query).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Does not exist');
            });
        }

        function getByPersonId(id, options) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            options = options || {};
            var resultSet = byPersonQryResultSet.replace(/<ID>/g, id);
            var qryObj = queryBuilder.buildQuery(medalQry, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize,
                qryObj.resultSetQuery, options.pagesPerQuery || 2);
        }

        function getRelatedMedals(id) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = relatedMedalQry.replace(/<ID>/g, id);
            return endpoint.getObjects(qry);
        }
    });
})();
