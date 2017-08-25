(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching times from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('timeRepository', function($q, AdvancedSparqlService, baseRepository, timeMapperService, ENDPOINT_CONFIG) {

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, timeMapperService);

        var prefixes =
            ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
            ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
            ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
            ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
            ' PREFIX sch: <http://schema.org/>' +
            ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
            ' PREFIX suo: <http://www.yso.fi/onto/suo/> ';

        var allQry = prefixes +
            ' SELECT ?id ?bob ?eoe ?label ' +
            ' WHERE { ' +
            '   GRAPH <http://ldf.fi/warsa/events/times> { ' +
            '     ?id crm:P82a_begin_of_the_begin ?bob ; ' +
            '       crm:P82b_end_of_the_end ?eoe . ' +
            '       skos:prefLabel ?label ; ' +
            '   } ' +
            ' } ' +
            ' ORDER BY ?bob ?eoe ';

        var byIdQry = prefixes +
            ' SELECT ?id ?bob ?eoe ?label ' +
            ' WHERE { ' +
            '   GRAPH <http://ldf.fi/warsa/events/times> { ' +
            '     VALUES ?id { <ID> } ' +
            '     ?id crm:P82a_begin_of_the_begin ?bob ; ' +
            '       crm:P82b_end_of_the_end ?eoe ; ' +
            '       skos:prefLabel ?label ; ' +
            '   } ' +
            ' } ' +
            ' ORDER BY ?bob ?eoe ';

        this.getAll = function() {
            return endpoint.getObjects(allQry);
        };

        this.getById = function(id) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            return endpoint.getObjects(byIdQry.replace(/<ID>/g, id)).then(function(data) {
                if (data.length) {
                    return data[0];
                }
                return $q.reject('Failed to get TimeSpan');
            });
        };
    });
})();
