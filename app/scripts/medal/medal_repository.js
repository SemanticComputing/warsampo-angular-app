'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
.service('medalRepository', function($q, SparqlService, medalMapperService) {

    var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

    var prefixes = '' +
    ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
    ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
    ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
    ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
    ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
    ' PREFIX sch: <http://schema.org/> ' +
    ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
    ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
    ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> ' +
    ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
    ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
    ' PREFIX medal: <http://ldf.fi/warsa/medals/> ';

    var medalQry = prefixes +
    ' 	SELECT DISTINCT ?id ?label WHERE {  ' +
    '         VALUES ?id { {0} } .   ' +
    ' 	    ?id a medal:Medal . ' +
    '			 ?id skos:prefLabel ?label . ' +
    ' 	} ';
	
    var relatedMedalQry = prefixes +
    ' SELECT DISTINCT ?id ?label WHERE {  ' +
    '   { SELECT DISTINCT ?id (COUNT(?actor) AS ?no) WHERE {  ' +
    '  VALUES ?medal { {0} } .  ' +
    '    ?evt a  crm:E13_Attribute_Assignment ; ' +
    '    		crm:P141_assigned ?medal ; ' +
    '    		crm:P11_had_participant ?actor . ' +
    '       ?evt2 a crm:E13_Attribute_Assignment ; ' +
    '    		crm:P141_assigned ?id ; ' +
    '    		crm:P11_had_participant ?actor . ' +
    '       FILTER (?medal != ?id) ' +
    '  } GROUP BY ?id } ' +
    '   ?id skos:prefLabel ?label . ' +
    ' } ORDER BY desc(?no) ';

    this.getById = function(id) {
        var qry = medalQry.format('<{0}>'.format(id));
        return endpoint.getObjects(qry).then(function(data) {
            if (data.length) {
            	 return medalMapperService.makeObjectList(data)[0];
            }
            return $q.reject('Does not exist');
        });
    };
	
    this.getRelatedMedals = function(id) {
        var qry = relatedMedalQry.format('<{0}>'.format(id));
        return endpoint.getObjects(qry).then(function(data) {
        		return medalMapperService.makeObjectList(data);
        });
    };
});

