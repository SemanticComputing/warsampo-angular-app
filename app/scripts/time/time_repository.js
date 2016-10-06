'use strict';
/* eslint-disable angular/no-service-method */

/*
 * Service that provides an interface for fetching times from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
.service('timeRepository', function($q, SparqlService, timeMapperService, SPARQL_ENDPOINT_URL) {

    var endpoint = new SparqlService(SPARQL_ENDPOINT_URL);

    var prefixes =
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>';

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
        '     VALUES ?id { {0} } ' +
        '     ?id crm:P82a_begin_of_the_begin ?bob ; ' +
        '       crm:P82b_end_of_the_end ?eoe ; ' +
        '       skos:prefLabel ?label ; ' +
        '   } ' +
        ' } ' +
        ' ORDER BY ?bob ?eoe ';

    this.getAll = function() {
        // Get all times.
        // Returns a promise.
        return endpoint.getObjects(allQry).then(function(data) {
            return timeMapperService.makeObjectList(data);
        });
    };

    this.getById = function(id) {
        return endpoint.getObjects(byIdQry.format('<' + id + '>')).then(function(data) {
            if (data.length) {
                return timeMapperService.makeObjectList(data)[0];
            }
            return $q.reject('Failed to get TimeSpan');
        });
    };
});
