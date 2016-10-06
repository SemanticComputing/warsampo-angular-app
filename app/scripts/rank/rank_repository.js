(function() {
    'use strict';

    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching actor data.
    */
    angular.module('eventsApp')
    .service('rankRepository', function($q, SparqlService, rankMapperService, SPARQL_ENDPOINT_URL) {

        var self = this;

        self.getById = getById;
        self.getRelatedRanks = getRelatedRanks;

        var endpoint = new SparqlService(SPARQL_ENDPOINT_URL);

        var prefixes =
        ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX dct: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX org: <http://rdf.muninn-project.org/ontologies/organization#> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ';

        var rankQry = prefixes  +
        'SELECT DISTINCT ?id ?label ?abbrev ?comment ?wikilink ?description ' +
        'WHERE { ' +
        '  VALUES ?id { {0} } . ' +
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
        '    VALUES ?rank { {0}  } .   ' +
        '    ?id a wsc:Rank . ' +
        '    { ?id org:rankSeniorTo ?rank . ' +
        '     BIND (2 AS ?level) .' +
        '    } UNION { ' +
        '     ?rank org:rankSeniorTo ?id . ' +
        '     BIND (0 AS ?level)' +
        '    } UNION {' +
        '     { ?id org:equalTo ?rank } UNION { ?rank dct:isPartOf ?id } UNION { ?id dct:isPartOf ?rank }' +
        '     BIND (1 AS ?level)' +
        '  }' +
        '  ?id skos:prefLabel ?label . ' +
        '}  GROUP BY ?id ?label ?level ORDER BY ?label' ;

        function getById(id) {
            var qry = rankQry.format('<{0}>'.format(id));

            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return rankMapperService.makeObjectList(data)[0];
                }
                return $q.reject('Does not exist');
            });
        }

        function getRelatedRanks(id) {
            var qry = relatedRankQry.format('<{0}>'.format(id));

            return endpoint.getObjects(qry).then(function(data) {
                return rankMapperService.makeObjectList(data);
            });
        }
    });
})();
