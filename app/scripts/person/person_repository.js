'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('personRepository', function($q, SparqlService, personMapperService) {

        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var prefixes = '' +
        ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX georss: <http://www.georss.org/georss/> ' +
        ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> ';

        var personQry = prefixes +
        ' SELECT DISTINCT ?id ?label ?sname ?fname ?note ?rank ?rankid ?birth_time ?death_time '+
        '       ?casualty ?birth_place ?birth_place_uri ?death_place ?death_place_uri ?bury_place ?bury_place_uri '+
        '       ?living_place ?living_place_uri ?profession ?mstatus ?num_children ?way_to_die ?cas_unit '+
        '       ?sid ?source ' +
        ' WHERE { ' +
        '   VALUES ?id { {0} }' +
        '   ?id foaf:familyName ?sname .' +
        '   ?id skos:prefLabel ?label .' +
        '   OPTIONAL { ?id foaf:firstName ?fname . }' +
        '   OPTIONAL { ?id crm:P3_has_note ?note . }' +
        '   OPTIONAL { ?id <http://purl.org/dc/elements/1.1/source> ?sid . ' +
        '     OPTIONAL { ?sid skos:prefLabel ?source . } ' +
        '   }' +
        '   OPTIONAL { ?id :hasRank ?rankid . ?rankid skos:prefLabel ?rank . }' +
        '   OPTIONAL { ' +
        '     ?id owl:sameAs ?casualty .' +
        '     ?casualty a foaf:Person .'  +
        '     OPTIONAL { ?casualty casualties:syntymaeaika ?birth_time . }' +
        '     OPTIONAL { ' +
        '       ?casualty casualties:synnyinkunta ?birth_place_uri . ' +
        '       ?birth_place_uri skos:prefLabel ?birth_place . ' +
        '     } ' +
        '     OPTIONAL { ?casualty casualties:kuolinaika ?death_time . } ' +
        '     OPTIONAL { ' +
        '         ?casualty casualties:kuolinkunta ?death_place_uri . '+
        '         ?death_place_uri skos:prefLabel ?death_place . ' +
        '     }' +
        '     OPTIONAL { ' +
        '         ?casualty casualties:hautauskunta ?bury_place_uri . ' +
        '         ?bury_place_uri skos:prefLabel ?bury_place . ' +
        '     } ' +
        '     OPTIONAL { ' +
        '         ?casualty casualties:asuinkunta ?living_place_uri . '+
        '         ?living_place_uri skos:prefLabel ?living_place . }' +
        '     OPTIONAL { ?casualty casualties:ammatti ?profession . }' +
        '     OPTIONAL {  ' +
        '         ?casualty casualties:siviilisaeaety ?mstatus_uri . ' +
        '         ?mstatus_uri skos:prefLabel ?mstatus . ' +
        '     }' +
        '     OPTIONAL { ?casualty casualties:ammatti ?profession . }' +
        '     OPTIONAL { ?casualty casualties:joukko_osasto ?cas_unit . }' +
        '     OPTIONAL { ?casualty casualties:lasten_lukumaeaerae ?num_children . } '+
        '     OPTIONAL { ' +
        '         ?casualty casualties:menehtymisluokka ?way_id . ' +
        '         ?way_id skos:prefLabel ?way_to_die . ' +
        '     } '+
        '   }' +
        ' } ';

		var nationalBibliographyQry = 		
		'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
		'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
		'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
		'PREFIX schema: <http://schema.org/>' +
		'PREFIX dcterms: <http://purl.org/dc/terms/>' +
		'PREFIX cidoc: <http://www.cidoc-crm.org/cidoc-crm/>' +
		' ' +
		'SELECT ?sub ?name ?images ?shortDescription ?description' +
		'		(SAMPLE(?placeOfBirth1) AS ?placeOfBirth) ?dateOfBirth' +
		'		(SAMPLE(?placeOfDeath1) AS ?placeOfDeath) ?dateOfDeath' +
		'		' +
		'	WHERE {' +
		'	  ?sub rdfs:label ?name .' +
		'      		FILTER REGEX(?name, "{0}", "i")' +
		'	  ?sub schema:birthDate ?dateOfBirth . FILTER (?dateOfBirth{1}) .' +
		'  	  ?sub schema:deathDate ?dateOfDeath . FILTER (?dateOfDeath{2}) .' +
		'	  OPTIONAL {?birth cidoc:P98_brought_into_life ?sub . ' +
		'                ?birth cidoc:P7_took_place_at ?place . ' +
		'                ?place rdfs:label ?placeOfBirth1 .} ' +
		'	  OPTIONAL {?death cidoc:P100_was_death_of ?sub . ' +
		'                ?death cidoc:P7_took_place_at ?placeD . ' +
		'                ?placeD rdfs:label ?placeOfDeath1 . } ' +
		'	  OPTIONAL {?sub schema:image ?images } ' +
		'	  OPTIONAL {?sub dcterms:type ?shortDescription } ' +
		'	  OPTIONAL {?sub rdfs:comment ?description } ' +
		'} GROUP BY ?sub ?name ?dateOfBirth ?placeOfBirth ?dateOfDeath ?placeOfDeath ?images ?shortDescription ?description ';
		
		//	Query for searching people with matching names: 'La' -> 'Laine','Laaksonen' etc
		var selectorQuery = prefixes +
        'SELECT DISTINCT ?name ?id WHERE {	' +
		'  SELECT DISTINCT ?name ?id WHERE {	' +
		'    GRAPH <http://ldf.fi/warsa/actors> {	' +
		'      ?id a atypes:MilitaryPerson .   	    	' +
		'      ?id skos:prefLabel ?name .   	    	' +
		'      FILTER (regex(?name, "^{0}$", "i"))	' +
		'    } 	' +
		'  } LIMIT 300 	' +
		'} ORDER BY ?name 	';

        var byUnitQry = prefixes +
        'SELECT ?id ?sname ?fname ?label ?rank ?role ?join_start ?join_end (COUNT(?s) AS ?no) WHERE { ' +
        ' 	{ SELECT ?id ?role ?join_start ?join_end WHERE ' +
        ' 	    { ?evt a etypes:PersonJoining ; ' +
        ' 	    crm:P143_joined ?id . ' +
        ' 	    ?evt  crm:P144_joined_with {0} .  ' +
	    '       OPTIONAL { ?evt crm:P107_1_kind_of_member ?role . } ' +
	    '       OPTIONAL { ' +
        '           ?evt crm:P4_has_time-span ?join_time_id . ' +
        '           ?join_time_id crm:P82a_begin_of_the_begin ?join_start ; ' +
        '               crm:P82b_end_of_the_end ?join_end . ' +
        '       } ' +
        '    	} LIMIT 200' +
        '	} UNION ' +
        '    { SELECT ?id WHERE {' +
        ' 	    ?id owl:sameAs ?mennytmies . ' +
        ' 	    ?mennytmies a foaf:Person . ' +
        ' 	    ?mennytmies casualties:osasto {0} . ' +
        '    	} LIMIT 200 ' +
        ' 	} ' +
        '    OPTIONAL { ?s ?p ?id . } ' +
        '    ?id skos:prefLabel ?label . ' +
        '    ?id foaf:familyName ?sname .	' +
        '    OPTIONAL { ?id foaf:firstName ?fname .	} ' +
        '    OPTIONAL { ?id :hasRank ?ranktype . ?ranktype skos:prefLabel ?rank . } ' +
        '} GROUP BY ?id ?sname ?fname ?label ?no ?rank ?role ?join_start ?join_end ' +
        ' 		ORDER BY DESC(?no) LIMIT 100 ';

        var byRankQry = prefixes +
			'SELECT DISTINCT ?id ?sname ?fname WHERE {	' +
			'  {	' +
			'  SELECT DISTINCT ?id WHERE {	' +
			'  VALUES ?rank { {0} } .	' +
			'    ?id a atypes:MilitaryPerson .	' +
			'    ?id :hasRank ?rank .	' +
			'  }  LIMIT 20 	' +
			'} UNION {	' +
			'SELECT DISTINCT ?id WHERE {	' +
			'  VALUES ?rank { {0} } .	' +
			'    ?evt a etypes:Promotion .	' +
			'    ?evt :hasRank ?rank .    	' +
			'    ?evt crm:P11_had_participant ?id .   	' +
			'  	?id a atypes:MilitaryPerson .	' +
			'    }  LIMIT 20 }	' +
			'  ?id foaf:familyName ?sname .	' +
			'  ?id foaf:firstName ?fname .	' +
			'} LIMIT 20	';

        var casualtiesByTimeSpanQry = prefixes +
        ' SELECT DISTINCT ?id ?label ?death_time ?casualty ' +
        ' WHERE { ' +
        '   ?id skos:prefLabel ?label . ' +
        '   ?id owl:sameAs ?casualty . ' +
        '   ?casualty a foaf:Person . ' +
        '   ?casualty casualties:kuolinaika ?death_time . ' +
        '   FILTER(?death_time >= "{0}"^^xsd:date && ?death_time <= "{1}"^^xsd:date) ' +
        ' } ';

        this.getByUnitId = function(id) {
            var qry = byUnitQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
                return personMapperService.makeObjectList(data);
            });
        };

        this.getByRankId = function(id) {
            var qry = byRankQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
                return personMapperService.makeObjectList(data);
            });
        };

        this.getById = function(id) {
            var qry = personQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    // because of temporary multiple labels in casualties data set:
                    return personMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Does not exist");
            });
        };

        this.getByIdList = function(ids) {
            var qry;
            if (_.isArray(ids)) {
                ids = "<{0}>".format(ids.join("> <"));
            } else if (ids) {
                ids = "<{0}>".format(ids);
            } else {
                return $q.when();
            }
            qry = personQry.format(ids);
            return endpoint.getObjects(qry).then(function(data) {
                return personMapperService.makeObjectList(data);
            });
        };

        this.getCasualtiesByTimeSpan = function(start, end) {
            return endpoint.getObjects(casualtiesByTimeSpanQry.format(start, end))
                .then(function(data) {
                    if (data.length) {
                        return personMapperService.makeObjectList(data);
                    }
                });
        };

       this.getNationalBibliography = function(person) {
           if (person.fname && person.fname.length>2) { 
           	  var sukunimi=person.sname, etunimi=person.fname;
              if (_.isArray(etunimi)) { etunimi=etunimi[0]; }
              
              var birthyearcondition='<"1925"';
              if ('birth_year' in person) {
              		birthyearcondition='="'+person.birth_year+'"';
              }
              
              var deathyearcondition='>"1938"';
              if ('death_year' in person) {
              		deathyearcondition='="'+person.death_year+'"';
              	}                      
					
               //	 marski http://ldf.fi/history/kb/p379
              var etu1 = (etunimi === 'Carl Gustaf Emil') ? 'Gustaf' :etunimi.split(' ')[0];
              var rgx = "^"+sukunimi+", .*("+etu1+").*$";
               
	           var qry = nationalBibliographyQry.format(rgx, birthyearcondition, deathyearcondition); 
	           
	           var end2 = new SparqlService("http://ldf.fi/history/sparql");
	           return end2.getObjects(qry).then(function(data) {
	           	  return personMapperService.makeObjectList(data);
	           });
           }
           return $q.when();
       };
       
		this.getItems = function (regx, controller) {
            var qry = selectorQuery.format("{0}".format(regx));
            controller.items = [ {id:'#', name:"Etsitään ..."} ];
            return endpoint.getObjects(qry).then(function(data) {
                var arr= personMapperService.makeObjectListNoGrouping(data);
                if (!arr.length) {
                	arr = [ {id:'#', name:"Ei hakutuloksia."} ];
                }
                controller.items=arr;
                return arr;
            });
        };
});

