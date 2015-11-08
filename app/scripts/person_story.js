//////////////////////////////////////////
/// SELECTOR


// google.maps.event.addDomListener(window, 'load', init);
function init() {
	
	initSelector('selector1');
	initPersonInfo('mapdiv');
	initStoryMap('mapdiv');
}

//////////////////////////////////////////
/// SELECTOR

function initSelector(id) {
	var endpoint = "http://ldf.fi/warsa/sparql"; 
	var query  = hereDoc(function() {/*! '
	 PREFIX : <http://ldf.fi/warsa/actors/> 
    PREFIX events: <http://ldf.fi/warsa/events/>
    PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> 
    PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> 
    PREFIX dcterms: <http://purl.org/dc/terms/> 
    PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#> 
    PREFIX xml: <http://www.w3.org/XML/1998/namespace> 
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
    PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> 
    PREFIX owl: <http://www.w3.org/2002/07/owl#> 
    PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
    
SELECT DISTINCT ?term ?uri WHERE { 
    
    ?uri a atypes:MilitaryPerson .
    ?uri skos:prefLabel ?term .
    ?uri foaf:familyName ?fname .
    FILTER (regex(?term, "^.*<INPUT>.*$", "i")) 
}   ORDER BY lcase(?fname)
	LIMIT 200 ' */});
	var param = {selectSize: 32};
	createSelector(id,endpoint,query,param); 	
}

//////////////////////////////////////////
/// STORY MAP

function initStoryMap(id) {
    var url = 'http://ldf.fi/warsa/sparql';
    // Default or selected values values
    var uri = getSelectionUri('selector1');
    if (emptyValue(uri)) 
    	uri = ':person_1'; // 
    else 
    	uri = '<' + uri + '>';
    var label = getSelectionLabel('selector1');
    if (emptyValue(label)) label = 'Carl Gustaf Emil Mannerheim';
    clearReslist();
    clearElement('resimages');
    var eventQry = hereDoc(function() {/*! 
        PREFIX : <http://ldf.fi/warsa/actors/> 
    PREFIX events: <http://ldf.fi/warsa/events/>
    PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> 
    PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> 
    PREFIX ranks: <http://ldf.fi/warsa/actors/ranks/>
    PREFIX dcterms: <http://purl.org/dc/terms/> 
    PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#> 
    PREFIX xml: <http://www.w3.org/XML/1998/namespace> 
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
    PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> 
    PREFIX owl: <http://www.w3.org/2002/07/owl#> 
    PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
    
SELECT DISTINCT * WHERE { 
    
    VALUES ?person {<URI>}
    
    { ?id a etypes:Battle . 
      ?id crm:P11_had_participant ?person . 
      ?id events:hadUnit ?unit . 
      ?id skos:prefLabel ?description . }
    UNION
    { ?id crm:P11_had_participant ?person . ?id skos:prefLabel ?description . }
    UNION 
    { ?id a etypes:Promotion . ?id crm:P11_had_participant ?person .
        { ?id :hasRank ?rank . ?rank skos:prefLabel ?description . }
    }
    UNION 
    { ?id a etypes:PersonJoining . ?id crm:P143_joined ?person .
      {
      ?id crm:P107_1_kind_of_member ?role .
      ?id crm:P144_joined_with ?unit. 
      ?unit skos:prefLabel ?description . 
      }
    } UNION { ?id dcterms:subject ?person . 
    	?id a <http://purl.org/dc/dcmitype/Image> .
    	?id dcterms:description ?description .
    	?id <http://schema.org/contentUrl> ?url . }
    
   ?id a ?idclass .
  	 
    OPTIONAL {
      ?id crm:P4_has_time-span ?time . 
      ?time crm:P82a_begin_of_the_begin ?start_time . 
      ?time crm:P82b_end_of_the_end ?end_time . 
    }
  	
    OPTIONAL { 
      ?id crm:P7_took_place_at ?place_id .
      OPTIONAL {
        ?place_id skos:prefLabel ?place_label . 
        ?place_id geo:lat ?lat ;  geo:long ?lon . 
      }
    }
} ORDER BY ?start_time ?end_time
    
 */});
    eventQry=eventQry.replace('<URI>', uri);
    insertStoryMap(id, url, eventQry, label, ''); // 'Biography Events of <a target="_blank" linkcolor="blue" href="http://www.kansallisbiografia.fi/">National Biography</a> Chronologically');
}

function initPersonInfo(id) {
    var url = 'http://ldf.fi/warsa/sparql';
    // Default or selected values values
    var uri = getSelectionUri('selector1');
    if (emptyValue(uri)) 
    	uri = ':person_1'; // 
    else 
    	uri = '<' + uri + '>';
    var label = getSelectionLabel('selector1');
    if (emptyValue(label)) label = 'Carl Gustaf Emil Mannerheim';
    clearElement('reshead');
    var eventQry = hereDoc(function() {/*!
PREFIX : <http://ldf.fi/warsa/actors/> 
PREFIX events: <http://ldf.fi/warsa/events/>
PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> 
PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> 
PREFIX ranks: <http://ldf.fi/warsa/actors/ranks/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#> 
PREFIX xml: <http://www.w3.org/XML/1998/namespace> 
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> 
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
    
    
SELECT DISTINCT ?name ?sname ?fname ?bday1 ?bday2 ?dday1 ?dday2 ?rank ?note WHERE { 
    
  VALUES ?person  { <URI> }
  
  ?person skos:prefLabel ?name .
  ?person foaf:familyName ?sname . 
  OPTIONAL { ?person foaf:firstName ?fname . }
  OPTIONAL { ?person :hasRank ?ranktype . ?ranktype skos:prefLabel ?rank . }
  OPTIONAL { ?person crm:P3_has_note ?note . }
  
  OPTIONAL { ?birth a crm:E67_Birth . ?birth crm:P98_brought_into_life ?person . 
  	?birth crm:P4_has_time-span ?btime . 
  	?btime crm:P82a_begin_of_the_begin ?bday1 . ?btime crm:P82b_end_of_the_end ?bday2 .
  	}
  
  OPTIONAL { ?death a crm:E69_Death . ?death crm:P100_was_death_of ?person . 
  ?death crm:P4_has_time-span ?dtime . 
  ?dtime crm:P82a_begin_of_the_begin ?dday1 . ?dtime crm:P82b_end_of_the_end ?dday2 . 
  }
  
} 
*/});
    eventQry=eventQry.replace('<URI>', uri);
    insertPersonInfo(id, url, eventQry, label, ''); // 'Biography Events of <a target="_blank" linkcolor="blue" href="http://www.kansallisbiografia.fi/">National Biography</a> Chronologically');
}

