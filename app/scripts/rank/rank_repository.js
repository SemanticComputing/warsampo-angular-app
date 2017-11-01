(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('rankRepository', function($q, baseRepository, AdvancedSparqlService, rankMapperService, ENDPOINT_CONFIG) {

        var self = this;

        self.getById = getById;
        self.getRelatedRanks = getRelatedRanks;

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, rankMapperService);

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX org: <http://rdf.muninn-project.org/ontologies/organization#> ' +
        ' PREFIX wra: <http://ldf.fi/warsa/actors/ranks/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ';

        var rankQry = prefixes  +
        'SELECT DISTINCT ?id ?label ?abbrev ?comment ?wikilink ?description ' +
        'WHERE { ' +
        '  VALUES ?id { <ID> } . ' +
        '  ?id a wsc:Rank .  ' +
        '  ?id skos:prefLabel ?label . '  +
        '  OPTIONAL { ?id rdfs:comment ?comment }  ' +
        '  OPTIONAL { ?id dct:description ?description . } ' +
        '  OPTIONAL { ?id skos:altLabel ?abbrev }  ' +
        '  OPTIONAL { ?id foaf:page ?wikilink }  ' +
        '} ' +
        'GROUP BY ?id ?label ?abbrev ?comment ?wikilink ?description ';

        var relatedRankQry = prefixes +
        'SELECT ?id ?label ?level WHERE {' +
        ' { ' +
        '  VALUES ?rank { <ID>  } . ' +
        '  ?id org:rankSeniorTo ?rank . ' +
        '  BIND (2 AS ?level) .' +
        ' } UNION { ' +
        '  VALUES ?rank { <ID>  } . ' +
        '  ?rank org:rankSeniorTo ?id . ' +
        '  BIND (0 AS ?level)' +
        ' } UNION {' +
        '  VALUES ?rank { <ID>  } . ' +
        '  { ?id org:equalTo ?rank } UNION { ?rank dct:isPartOf ?id } UNION { ?id dct:isPartOf ?rank }' +
        '  BIND (1 AS ?level)' +
        ' }' +
        ' ?id skos:prefLabel ?label . ' +
        '} GROUP BY ?id ?label ?level ORDER BY ?label' ;

        function getById(ids) {
            ids = baseRepository.uriFy(ids);
            if (!ids) {
                return $q.when();
            }
            var qry = rankQry.replace(/<ID>/g, ids);
            return endpoint.getObjects(qry);
        }

        function getRelatedRanks(id) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = relatedRankQry.replace(/<ID>/g, id);
            return endpoint.getObjects(qry);
        }
    });
})();
