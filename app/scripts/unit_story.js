'use strict';
//////////////////////////////////////////
/// SELECTOR

/*
function init() {
	initSelector('unitSelector');
}
*/

//////////////////////////////////////////
/// SELECTOR

function initSelector(id) {
	var endpoint = "http://ldf.fi/warsa/sparql"; 
	var query  = '' + 
'     \'PREFIX : <http://ldf.fi/warsa/actors/>  ' + 
'     PREFIX events: <http://ldf.fi/warsa/events/> ' +
'     PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/>  ' +
'     PREFIX etypes: <http://ldf.fi/warsa/events/event_types/>  ' +
'     PREFIX dcterms: <http://purl.org/dc/terms/>  ' +
'     PREFIX foaf: <http://xmlns.com/foaf/0.1/>  ' +
'     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  ' +
'     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
'     PREFIX skos: <http://www.w3.org/2004/02/skos/core#>  ' +
'     PREFIX xml: <http://www.w3.org/XML/1998/namespace>  ' +
'     PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>  ' +
'     PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>  ' +
'     PREFIX owl: <http://www.w3.org/2002/07/owl#>  ' +
'     PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
' SELECT DISTINCT ?term ?uri WHERE {  ' +
'     ?ename a etypes:UnitNaming . ' +
'     ?ename skos:prefLabel ?term . ' +
'     ?ename crm:P95_has_formed ?uri . ' +
'     { ?id a crm:E66_Formation . ?id crm:P95_has_formed ?uri . } ' +
'     UNION ' +
'     { ?id a etypes:Battle . ?id crm:P11_had_participant ?uri . } ' +
'     UNION  ' +
'     { ?id a etypes:TroopMovement . ?id crm:P95_has_formed ?uri . } ' +
'     ?id crm:P7_took_place_at ?place_id . ' +
'     ?place_id geo:lat ?lat . ' +
'     FILTER (regex(?term, "^.*<INPUT>.*$", "i"))  ' +
' }   ORDER BY lcase(?term) ' +
' 	LIMIT 1000 \'';
	var param = {selectSize: 32};
	createSelector(id,endpoint,query,param); 	
}

//////////////////////////////////////////
/// STORY MAP

function initStoryMap(id) {
    var url = 'http://ldf.fi/warsa/sparql';
    // Default or selected values values
    var uri = getSelectionUri('selector1');
    // alert("initStoryMap:"+uri);
    if (emptyValue(uri)) 
    	uri = ':actor_940'; // 
    else 
    	uri = '<' + uri + '>';
    var label = getSelectionLabel('selector1');
    if (emptyValue(label)) label = 'Jalkaväkirykmentti 37';
    
    var eventQry = '' +
'     PREFIX : <http://ldf.fi/warsa/actors/>  ' +
'     PREFIX events: <http://ldf.fi/warsa/events/> ' +
'     PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/>  ' +
'     PREFIX etypes: <http://ldf.fi/warsa/events/event_types/>  ' +
'     PREFIX dcterms: <http://purl.org/dc/terms/>  ' +
'     PREFIX foaf: <http://xmlns.com/foaf/0.1/>  ' +
'     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  ' +
'     PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
'     PREFIX skos: <http://www.w3.org/2004/02/skos/core#>  ' +
'     PREFIX xml: <http://www.w3.org/XML/1998/namespace>  ' +
'     PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>  ' +
'     PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>  ' +
'     PREFIX owl: <http://www.w3.org/2002/07/owl#>  ' +
'     PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
' SELECT DISTINCT ?id ?start_time ?end_time ?description ?commander ?note ?place_label ?lat ?lon ' +
' WHERE { ' +
'   VALUES ?actor {<URI>} ' +
'   { ?id a crm:E66_Formation .  ' +
'     ?id crm:P95_has_formed ?actor .  ' +
'     ?id skos:prefLabel ?prefLabel .  ' +
'     OPTIONAL { ?actor crm:P3_has_note ?note . } ' +
'     BIND ( CONCAT("Perustaminen: ", ?prefLabel) AS ?description ) . ' +
'   }  ' +
'   UNION ' +
'   { ?id a etypes:TroopMovement .  ' +
'     ?id skos:prefLabel ?prefLabel .  ' +
'     ?id crm:P95_has_formed ?actor .  ' +
'     BIND ( CONCAT("Keskittäminen: ", ?prefLabel) AS ?description ) . ' +
'   }  ' +
'   UNION  ' +
'   { ?id a etypes:Battle .  ' +
'     ?id skos:prefLabel ?prefLabel .  ' +
'     ?id crm:P11_had_participant ?actor .  ' +
'     OPTIONAL { ?id events:hadCommander ?commander . } ' +
'     BIND ( CONCAT("Taistelu: ", ?prefLabel) AS ?description ) . ' +
'   } ' +
'   ?id crm:P4_has_time-span ?time .  ' +
'   ?time crm:P82a_begin_of_the_begin ?start_time .  ' +
'   ?time crm:P82b_end_of_the_end ?end_time .  ' +
'   { ?id crm:P7_took_place_at ?place_id . ' +
'   ?place_id skos:prefLabel ?place_label .  ' +
'   ?place_id geo:lat ?lat ;  geo:long ?lon . } ' +
' } ORDER BY ?start_time ?end_time ';
    eventQry=eventQry.replace('<URI>', uri);
    insertStoryMap(id, url, eventQry, label, ''); // 'Biography Events of <a target="_blank" linkcolor="blue" href="http://www.kansallisbiografia.fi/">National Biography</a> Chronologically');
}


