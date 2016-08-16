'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
.service('rankRepository', function($q, SparqlService, rankMapperService) {

    var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

    var prefixes = '' +
    ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
    ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
    ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
    ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
    ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
    ' PREFIX sch: <http://schema.org/> ' +
    ' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
    ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
    ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
    ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> ' +
    ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
    ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
    ' PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> ';

    
	 var rankQry = prefixes +
	 'SELECT DISTINCT ?id ?label ?abbrev ?comment ?wikilink ?desc '+
	'WHERE {            '+
	'  VALUES ?id { {0} } . '+
	'  VALUES ?preflang { "{1}" } '+
	'  ?id a <http://ldf.fi/warsa/actors/ranks/Rank> .  '+
	'  OPTIONAL { ?id skos:prefLabel ?label_any . filter (lang(?label_any)!=?preflang) }	 '+
	'  OPTIONAL { ?id skos:prefLabel ?label_pref . filter (lang(?label_pref)=?preflang) } '+
	'  BIND ( COALESCE(?label_pref,?label_any, "") AS ?label ) '+
	'   '+
	'  OPTIONAL { ?id <http://www.w3.org/2000/01/rdf-schema#comment> ?comment }  '+
	'   '+
	'  OPTIONAL { ?id dc:description ?desc_any . filter (lang(?desc_any)!=?preflang) }  '+
	'  OPTIONAL { ?id dc:description ?desc_pref . filter (lang(?desc_pref)=?preflang) }  '+
	'  BIND ( COALESCE(?desc_pref,?desc_any, "") AS ?desc ) '+
	'   '+
	'  OPTIONAL { ?id skos:altLabel ?abbrev }  '+
	'  OPTIONAL { ?id foaf:page ?wikilink }  '+
	'} '+
	'GROUP BY ?id ?label ?abbrev ?comment ?wikilink ?desc ';
	
	var rankQryOld = prefixes +
    ' 	SELECT DISTINCT ?id (GROUP_CONCAT(?name;separator=", ") AS ?label) ?label_fi ?label_en ?abbrev ?comment ?wikilink ?desc_fi ?desc_en WHERE {  ' +
    '         VALUES ?id { {0} } .   ' +
    ' 	    ?id a <http://ldf.fi/warsa/actors/ranks/Rank> . ' +
    ' 	    ?id skos:prefLabel ?name . ' + 
    '  	OPTIONAL { ?id skos:prefLabel ?label_fi . filter (lang(?label_fi)!="en") }' +
    '  	OPTIONAL { ?id skos:prefLabel ?label_en . filter (lang(?label_en)="en") }' + 
    ' 	    OPTIONAL { ?id <http://www.w3.org/2000/01/rdf-schema#comment> ?comment } ' +
    ' 	    OPTIONAL { ?id skos:altLabel ?abbrev } ' +
    '  OPTIONAL { ?id dc:description ?desc_fi . filter (lang(?desc_fi)!="en") }' +
    '  OPTIONAL { ?id dc:description ?desc_en . filter (lang(?desc_en)="en") }' +
    '			 OPTIONAL { ?id foaf:page ?wikilink } ' +
    ' 	} GROUP BY ?id ?label ?abbrev ?comment ?wikilink ?desc_fi ?desc_en ?label_fi ?label_en ';


    var relatedRankQry = prefixes +
    'PREFIX org: <http://rdf.muninn-project.org/ontologies/organization#> ' +
    'SELECT ?id ?label ?level WHERE {' +
    '    VALUES ?rank { {0}  } .   ' +    
	 '    VALUES ?preflang { "{1}" } '+
    '    ?id a       <http://ldf.fi/warsa/actors/ranks/Rank> . ' +
    '    ' +
    '     { ?id org:rankSeniorTo ?rank . ' +
    '    BIND (2 AS ?level) .' +
    '  } UNION { ' +
    '    ?rank org:rankSeniorTo ?id . ' +
    '    BIND (0 AS ?level)' +
    '  } UNION {' +
    '    { ?id org:equalTo ?rank } UNION { ?rank dcterms:isPartOf ?id } UNION { ?id dcterms:isPartOf ?rank }' +
    '    BIND (1 AS ?level)' +
    '  }' +
    '  OPTIONAL { ?id skos:prefLabel ?label_any . filter (lang(?label_any)!=?preflang) }	 '+
	 '  OPTIONAL { ?id skos:prefLabel ?label_pref . filter (lang(?label_pref)=?preflang) } '+
	 '  BIND ( COALESCE(?label_pref,?label_any, "") AS ?label ) '+
    '}  GROUP BY ?id ?label ?level ORDER BY ?label' ;

    this.getById = function(id) {
    	  var langtag = window.location.href.indexOf('/en/')>-1 ? "en" : "fi" ,
            qry = rankQry.format('<{0}>'.format(id)).format('{1}',langtag);
        
        return endpoint.getObjects(qry).then(function(data) {
        		if (data.length) {
        			return rankMapperService.makeObjectList(data)[0];
            }
            return $q.reject('Does not exist');
        });
    };

    this.getRelatedRanks = function(id) {
        var langtag = window.location.href.indexOf('/en/')>-1 ? "en" : "fi" ,
            qry = relatedRankQry.format('<{0}>'.format(id)).format('{1}',langtag);
        
        return endpoint.getObjects(qry).then(function(data) {
            return rankMapperService.makeObjectList(data);
        });
    };
});

