'use strict';

/*
 * Service that provides an interface for fetching events from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
.service('eventRepository', function($q, _, AdvancedSparqlService, eventMapperService) {

    var endpoint = new AdvancedSparqlService('http://ldf.fi/warsa/sparql',
        eventMapperService);

    var prefixes =
    ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
    ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
    ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
    ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
    ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
    ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
    ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
    ' PREFIX sch: <http://schema.org/>' +
    ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
    ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
    ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
    ' PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> ' +
    ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> ' +
    ' PREFIX actors: <http://ldf.fi/warsa/actors/> ' +
    ' PREFIX articles: <http://ldf.fi/schema/warsa/articles/> ';

    var singleEventQry = prefixes +
    ' SELECT ?id ?start_time ?end_time ?time_id ?description ?place_label ?place_id ' +
    '           ?municipality ?lat ?lon ?polygon ?type ?type_id ?participant  ' +
    ' WHERE { ' +
    '   VALUES ?id { {0} } ' +
    '   ?type_id rdfs:subClassOf* crm:E5_Event . ' +
    '   ?id a ?type_id . ' +
    '   ?type_id skos:prefLabel ?type . ' +
    '   FILTER(langMatches(lang(?type), "FI"))  ' +
    '   ?id skos:prefLabel ?description . ' +
    '   OPTIONAL { ?id crm:P11_had_participant ?participant . } ' +
    '   OPTIONAL { ' +
    '     ?id crm:P7_took_place_at ?place_id .  ' +
    '     ?place_id skos:prefLabel ?place_label . ' +
    '     OPTIONAL { ?place_id sch:polygon ?polygon . } ' +
    '     OPTIONAL { ' +
    '          ?place_id geo:lat ?lat ; ' +
    '            geo:long ?lon . ' +
    '     } ' +
    '     OPTIONAL { ' +
    '         GRAPH <http://ldf.fi/places/karelian_places> { ' +
    '             ?place_id geosparql:sfWithin ?municipality . ' +
    '         } ' +
    '         GRAPH <http://ldf.fi/places/municipalities> { ' +
    '             ?municipality a suo:kunta . ' +
    '         } ' +
    '     } ' +
    '   } ' +
    '   OPTIONAL { ?id crm:P4_has_time-span ?time_id . ' +
    '     GRAPH <http://ldf.fi/warsa/events/times> { ' +
    '       ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
    '                crm:P82b_end_of_the_end ?end_time . ' +
    '     } ' +
    '   } ' +
    ' } ' +
    ' ORDER BY ?start_time ?end_time ';

    var eventQry = prefixes +
    ' SELECT ?id ?start_time ?end_time ?time_id ?description ?place_label ' +
    '           ?place_id ?municipality ?lat ?lon ?polygon ?type ?type_id ?participant  ' +
    ' WHERE { ' +
    '   GRAPH <http://ldf.fi/warsa/events> { ' +
    '     ?id crm:P4_has_time-span ?time_id ; ' +
    '       a ?type_id . ' +
    '     {0} ' + // Placeholder for type filter
    '   } ' +
    '   FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/TroopMovement>) ' +
    '   FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/Battle>) ' +
    '   ?id skos:prefLabel ?description . ' +
    '   GRAPH <http://ldf.fi/warsa/events/times> { ' +
    '     ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
    '        crm:P82b_end_of_the_end ?end_time . ' +
    '     {1} ' + // Placeholder for time filter
    '   } ' +
    '   GRAPH <http://ldf.fi/warsa/events/event_types> { ' +
    '     ?type_id skos:prefLabel ?type . ' +
    '     FILTER(langMatches(lang(?type), "FI"))  ' +
    '   } ' +
    '   OPTIONAL { ?id crm:P11_had_participant ?participant . } ' +
    '   OPTIONAL { ' +
    '     ?id crm:P7_took_place_at ?place_id .  ' +
    '     { ' +
    '       ?place_id skos:prefLabel ?place_label . ' +
    '       OPTIONAL { ?place_id sch:polygon ?polygon . } ' +
    '       OPTIONAL { ' +
    '         ?place_id geo:lat ?lat ; ' +
    '            geo:long ?lon . ' +
    '        } ' +
    '        OPTIONAL { ' +
    '          GRAPH <http://ldf.fi/places/karelian_places> { ' +
    '            ?place_id geosparql:sfWithin ?municipality . ' +
    '          } ' +
    '          GRAPH <http://ldf.fi/places/municipalities> { ' +
    '            ?municipality a suo:kunta . ' +
    '          } ' +
    '        } ' +
    '      } UNION {  ' +
    '        SERVICE <http://ldf.fi/pnr/sparql> { ' +
	'		   ?place_id skos:prefLabel ?place_label . ' +
    '          FILTER(langMatches(lang(?place_label), "FI")) ' +
    '    	   ?place_id geo:lat ?lat ; ' +
    '            geo:long ?lon . ' +
    '  	     } ' +
    '      } ' +
    '   } ' +
    ' } ' +
    ' ORDER BY ?start_time ?end_time ';

    var eventsByPlaceQry = prefixes +
    ' SELECT ?id ?start_time ?end_time ?time_id ?description ?place_label ' +
    '           ?place_id ?municipality ?lat ?lon ?polygon ?type ?type_id ?participant  ' +
    ' WHERE { ' +
    '   VALUES ?place_id { {0} } ' +
    '   ?id crm:P4_has_time-span ?time_id ; ' +
    '       a ?type_id . ' +
    '   {1} ' + // Placeholder for id filter
    '   FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/TroopMovement>) ' +
    '   FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/Battle>) ' +
    '   ?id skos:prefLabel ?description ; ' +
    '       crm:P7_took_place_at ?place_id .  ' +
    '   ?place_id skos:prefLabel ?place_label . ' +
    '   GRAPH <http://ldf.fi/warsa/events/times> { ' +
    '     ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
    '              crm:P82b_end_of_the_end ?end_time . ' +
    '   } ' +
    '   GRAPH <http://ldf.fi/warsa/events/event_types> { ' +
    '     ?type_id skos:prefLabel ?type . ' +
    '     FILTER(langMatches(lang(?type), "FI"))  ' +
    '  ' +
    '   } ' +
    '   OPTIONAL { ?id crm:P11_had_participant ?participant . } ' +
    '   OPTIONAL { ?place_id sch:polygon ?polygon . } ' +
    '   OPTIONAL { ' +
    '            ?place_id geo:lat ?lat ; ' +
    '              geo:long ?lon . ' +
    '   } ' +
    '   OPTIONAL { ' +
    '       GRAPH <http://ldf.fi/places/karelian_places> { ' +
    '           ?place_id geosparql:sfWithin ?municipality . ' +
    '       } ' +
    '       GRAPH <http://ldf.fi/places/municipalities> { ' +
    '               ?municipality a suo:kunta . ' +
    '       } ' +
    '   } ' +
    ' } ' +
    ' ORDER BY ?start_time ?end_time ';

    var eventsByActorQry = prefixes +
    '  SELECT ?id ?start_time ?end_time ?time_id ?description ?place_label ' +
    '       ?commander ?place_id ?municipality ?lat ?lon ?polygon ?type ?type_id ?participant ' +
    '   WHERE {  ' +
    '      ' +
    '       VALUES ?participant { {0} }  ' +
    '      ' +
    '       ?id crm:P4_has_time-span ?time_id ;  ' +
    '           a ?type_id .  ' +
    '        ' +
    '       { ?id a crm:E66_Formation .  ' +
    '        ?id crm:P95_has_formed ?participant .  ' +
    '        ?id skos:prefLabel ?description .  ' +
    '        OPTIONAL { ?actor crm:P3_has_note ?note . } ' +
    '      }  ' +
    '      UNION ' +
    '      { ?id a etypes:TroopMovement .  ' +
    '        ?id skos:prefLabel ?description .  ' +
    '        ?id crm:P95_has_formed ?participant .  ' +
    '      }  ' +
    '      UNION  ' +
    '      { ?id a etypes:Battle .  ' +
    '        ?id skos:prefLabel ?description .  ' +
    '        ?id crm:P11_had_participant ?participant .  ' +
    '        OPTIONAL { ?id events:hadCommander ?commander . } ' +
    '      } ' +
    '          ' +
    '       OPTIONAL { ?id crm:P7_took_place_at ?place_id .   ' +
    '        ?place_id skos:prefLabel ?place_label .  ' +
    '        OPTIONAL { ?place_id sch:polygon ?polygon . }  ' +
    '        OPTIONAL {  ' +
    '              ?place_id geo:lat ?lat ;  ' +
    '                geo:long ?lon .  ' +
    '        }  ' +
    '        OPTIONAL {  ' +
    '             GRAPH <http://ldf.fi/places/karelian_places> { ?place_id geosparql:sfWithin ?municipality .  }  ' +
    '             GRAPH <http://ldf.fi/places/municipalities> {   ?municipality a suo:kunta .  }  ' +
    '        }  ' +
    '     }  ' +
    '     GRAPH <http://ldf.fi/warsa/events/times> {  ' +
    '       ?time_id crm:P82a_begin_of_the_begin ?start_time ;  ' +
    '                crm:P82b_end_of_the_end ?end_time .  ' +
    '     }  ' +
    '     GRAPH <http://ldf.fi/warsa/events/event_types> {  ' +
    '       ?type_id skos:prefLabel ?type .  ' +
    '       FILTER(langMatches(lang(?type), "FI"))   ' +
    '     }  ' +
    '   }  ' +
    '   ORDER BY ?start_time ?end_time ';

    var eventsAndSubUnitEventsByUnitQry = prefixes +
    ' SELECT ?id ?start_time ?end_time ?time_id ?description ?note ' +
    ' ?place_label ?commander ?place_id ?municipality ?lat ?lon ?type ' +
    ' ?type_id ?participant ' +
    ' WHERE { ' +
    '     { ' +
    '         VALUES ?participant { {0} } ' +
    '         { ' +
    '             ?id a crm:E66_Formation ; ' +
    '                 crm:P95_has_formed ?participant ; ' +
    '                 skos:prefLabel ?description . ' +
    '             OPTIONAL { ?id crm:P3_has_note ?note . } ' +
    '         } UNION { ' +
    '             ?id a etypes:TroopMovement ; ' +
    '                 skos:prefLabel ?description ; ' +
    '                 crm:P95_has_formed ?participant . ' +
    '         } ' +
    '     } UNION { ' +
    '         { ' +
    '             SELECT ?participant ?abbrev ' +
    '             WHERE { ' +
    '                 VALUES ?unit { {0} } . ' +
    '                 ?unit (^crm:P144_joined_with/crm:P143_joined)+ ?participant . ' +
    '                 ?participant a atypes:MilitaryUnit . ' +
    '                 ?participant skos:altLabel ?abbrev . ' +
    '             } ' +
    '         } UNION { ' +
    '             VALUES ?participant { {0} } . ' +
    '             ?participant skos:altLabel ?abbrev . ' +
    '         } ' +
    '         ?id a etypes:Battle . ' +
    '         ?id skos:prefLabel ?description . ' +
    '         { ' +
    '             ?id events:hadUnit ?abbrev . ' +
    '         } UNION { ' +
    '             ?id crm:P11_had_participant ?participant . ' +
    '         } ' +
    '         OPTIONAL { ?id events:hadCommander ?commander . } ' +
    '     } ' +
    '     ?id crm:P4_has_time-span ?time_id ; ' +
    '         a ?type_id . ' +
    '     GRAPH <http://ldf.fi/warsa/events/times> { ' +
    '         ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
    '             crm:P82b_end_of_the_end ?end_time . ' +
    '         FILTER (?start_time<=?end_time) . ' +
    '     } ' +
    '     ?type_id skos:prefLabel ?type . ' +
    '     FILTER(langMatches(lang(?type), "FI")) ' +
    '     OPTIONAL { ' +
    '         ?id crm:P7_took_place_at ?place_id . ' +
    '         ?place_id skos:prefLabel ?place_label . ' +
    '         OPTIONAL { ?place_id sch:polygon ?polygon . } ' +
    '         OPTIONAL { ?place_id geo:lat ?lat ; geo:long ?lon . } ' +
    '         OPTIONAL { ' +
    '             GRAPH <http://ldf.fi/places/karelian_places> { ' +
    '                 ?place_id geosparql:sfWithin ?municipality . ' +
    '             } ' +
    '             GRAPH <http://ldf.fi/places/municipalities> { ' +
    '                 ?municipality a suo:kunta . ' +
    '             } ' +
    '         } ' +
    '     } ' +
    ' } ORDER BY ?start_time ?end_time ';

    var byPersonQry = prefixes +
    ' SELECT DISTINCT ?id ?type_id ?type ?description (?description AS ?label) ' +
    '                ?unit ?participant_role ?link ?start_time ?end_time ?time_id ?medal ' +
    ' WHERE { ' +
    ' 	  VALUES ?person { {0} } . ' +
    ' 	    { ?id crm:P11_had_participant ?person ; ' +
    ' 	      	skos:prefLabel ?description . ' +
    ' 	      	OPTIONAL { ?id events:hadUnit ?unit . } ' +
    '        }' +
    ' 	    UNION  ' +
    ' 	    { ?id a etypes:PersonJoining . ?id crm:P143_joined ?person . ' +
    ' 	      ?id crm:P107_1_kind_of_member ?participant_role .  ' +
    ' 	      ?id crm:P144_joined_with ?unit . ' +
    ' 	      ?unit skos:prefLabel ?description . '+
    ' 	    }  '+
    ' 	    UNION '+
    ' 	    { '+
    '        ?id a articles:Article ; '+
    '        dcterms:hasFormat ?link ; '+
    '        <http://purl.org/dc/elements/1.1/title> ?description ; '+
    '        { ?id dcterms:subject ?person . }  '+
    '        UNION  '+
    '        { ?id articles:nerperson ?person . }  '+
    '        UNION  '+
    '        { ?author skos:relatedMatch ?person . ?id articles:author ?author . } '+
    '      } ' +
    ' 	   ?id a ?type_id . ' +
    '			OPTIONAL { ?id crm:P141_assigned ?medal } ' +
    '       OPTIONAL { ' +
    '         ?type_id skos:prefLabel ?type . ' +
    '         FILTER(langMatches(lang(?type), "FI")) ' +
    ' 	    } ' +
    ' 	    OPTIONAL { ' +
    ' 	      ?id crm:P4_has_time-span ?time_id .  ' +
    ' 	      ?time_id crm:P82a_begin_of_the_begin ?start_time ;  ' +
    ' 	      		crm:P82b_end_of_the_end ?end_time .  ' +
    ' 	    } ' +
    ' 	    OPTIONAL { ' +
    ' 	      ?id crm:P7_took_place_at ?place_id . ' +
    ' 	      OPTIONAL { ' +
    ' 	        ?place_id skos:prefLabel ?place_label .  ' +
    ' 	        ?place_id geo:lat ?lat ;  geo:long ?lon .  ' +
    ' 	      } ' +
    ' 	    } ' +
    ' } ORDER BY ?start_time ?end_time ';

    var personLifeEventsQry = prefixes +
    ' SELECT DISTINCT ?id ?type ?type_id ?time_id ?description ?start_time ' +
    '                ?end_time ?rank ?rank_id ?place_id ?place_label ' +
    ' WHERE { ' +
    '  VALUES ?person { {0} } ' +
    '  { ?id a crm:E67_Birth ; crm:P98_brought_into_life ?person . } ' +
    '  UNION  ' +
    '  { ?id a crm:E69_Death ; crm:P100_was_death_of ?person . } ' +
    '  UNION  ' +
    '  { ?id a etypes:Disappearing ; crm:P11_had_participant ?person . } ' +
    '  UNION  ' +
    '  { ?id a etypes:Wounding ; crm:P11_had_participant ?person . } ' +
    '  UNION  ' +
    '  { ?id a etypes:Promotion ; ' +
    '    crm:P11_had_participant ?person .  ' +
    '    OPTIONAL { ?id actors:hasRank ?rank_id . ?rank_id skos:prefLabel ?rank . } ' +
    '  } ' +
    '  OPTIONAL { ?id crm:P4_has_time-span ?time_id .  ' +
    '  ?time_id crm:P82a_begin_of_the_begin ?start_time . ' +
    '  ?time_id crm:P82b_end_of_the_end ?end_time . } ' +
    '	   OPTIONAL {  ' +
    '        ?id crm:P7_took_place_at ?place_id . ' +
    '        OPTIONAL { ' +
    '          ?place_id skos:prefLabel ?place_label . ' +
    '        } ' +
    '      } ' +
    '  ?id a ?type_id . ' +
    '  OPTIONAL { ?id skos:prefLabel ?description . } ' +
    '  OPTIONAL { ' +
    '    ?type_id skos:prefLabel ?type . ' +
    '    FILTER(langMatches(lang(?type), "FI")) ' +
    '  } ' +
    ' } ORDER BY ?start_time  ';

    var unitEventQry = prefixes +
    '  SELECT ?id ?type_id ?type ?description ?time_id ?start_time ?end_time ' +
    '          ?place_id ?place_label ' +
    '  WHERE { ' +
    '      VALUES ?unit  { {0} } ' +
    '      { ' +
    '        ?id a crm:E66_Formation ; ' +
    '        	crm:P95_has_formed ?unit . OPTIONAL { ?id skos:altLabel ?abbrev . }' +
    '      } UNION { ' +
    '        ?id a etypes:UnitNaming ; ' +
    '          	crm:P95_has_formed ?unit . OPTIONAL { ?id skos:altLabel ?abbrev . }' +
    '      } UNION { ' +
    '       	?id a etypes:TroopMovement ; ' +
    '        	crm:P95_has_formed ?unit . ' +
    '      } UNION { ' +
    '        ?id a etypes:Battle ; ' +
    '        	crm:P11_had_participant ?unit . ' +
    '      } ' +
    '      ?id a ?type_id . ' +
    '       OPTIONAL { ' +
    '         ?type_id skos:prefLabel ?type . ' +
    '         FILTER(langMatches(lang(?type), "FI")) ' +
    ' 	    } ' +
    '	   OPTIONAL { ?id skos:prefLabel ?description . } ' +
    '	    ' +
    '	   OPTIONAL { ' +
    '        ?id crm:P4_has_time-span ?time_id .  ' +
    '        ?time crm:P82a_begin_of_the_begin ?start_time ;  ' +
    '              crm:P82b_end_of_the_end ?end_time .  ' +
    '	   } ' +
    '	   OPTIONAL {  ' +
    '        ?id crm:P7_took_place_at ?place_id . ' +
    '        OPTIONAL { ' +
    '          ?place_id skos:prefLabel ?place_label . ' +
    '        } ' +
    '      } ' +
    '	} ORDER BY ?start_time ?end_time ';

    var eventTypeFilter =
    '   FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/TroopMovement>) ' +
    '   FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/Battle>) ';

    var eventFilterWithinTimeSpan =
    'FILTER(?start_time >= "{0}"^^xsd:date && ?end_time <= "{1}"^^xsd:date)';

    var eventsWithinTimeSpanQry = eventQry.format(eventTypeFilter, eventFilterWithinTimeSpan);

    var eventFilterWithinTimeSpanRelaxed =
    'FILTER( ' +
    '   (?start_time >= "{0}"^^xsd:date && ' +
    '   ?start_time <= "{1}"^^xsd:date) || ' +
    '   (?end_time >= "{0}"^^xsd:date && ' +
    '   ?end_time <= "{1}"^^xsd:date) ' +
    ')';

    var eventsWithinRelaxedTimeSpanQry = eventQry.format('', eventFilterWithinTimeSpanRelaxed);

    var allEventsQry = eventQry.format('', '');

    this.getByTimeSpan = function(start, end, pageSize) {
        // Get events that occured between the dates start and end (inclusive).
        // Returns a promise.
        return endpoint.getObjects(eventsWithinTimeSpanQry.format(start, end, pageSize));
    };

    this.getAllEvents = function(pageSize) {
        // Get all events.
        // Returns a promise.
        return endpoint.getObjects(allEventsQry, pageSize);
    };

    this.getById = function(id) {
        var qry = singleEventQry.format('<' + id + '>');
        return endpoint.getObjects(qry).then(function(data) {
            if (data.length) {
                return (data)[0];
            }
            return $q.reject('Does not exist');
        });
    };

    this.getLooselyWithinTimeSpan = function(start, end, pageSize) {
        // Get events that at least partially occured between the dates start and end.
        // Returns a promise.
        var qry = eventsWithinRelaxedTimeSpanQry.format(start, end);
        return endpoint.getObjects(qry, pageSize);
    };

    this.getLooselyWithinTimeSpanFilterById = function(start, end, id, pageSize) {
        // Get events that at least partially occured between the dates start and end.
        // Filter out the given id.
        // Returns a promise.
        var qry = eventQry
            .format('FILTER(?id != {0})'
                    .format('<' + id + '>'), eventFilterWithinTimeSpanRelaxed)
                    .format(start, end);
        return endpoint.getObjects(qry, pageSize);
    };

    this.getByPlaceId = function(ids, pageSize) {
        var qry;
        if (_.isArray(ids)) {
            ids = '<{0}>'.format(ids.join('> <'));
        } else if (ids) {
            ids = '<{0}>'.format(ids);
        } else {
            return $q.when();
        }
        qry = eventsByPlaceQry.format(ids, '');
        return endpoint.getObjects(qry, pageSize);
    };

    this.getByPlaceIdFilterById = function(placeIds, id, pageSize) {
        var qry;
        if (_.isArray(placeIds)) {
            placeIds = '<{0}>'.format(placeIds.join('> <'));
        } else if (placeIds) {
            placeIds = '<{0}>'.format(placeIds);
        } else {
            return $q.when();
        }
        var filter = 'FILTER(?id != {0})'.format('<' + id + '>');
        qry = eventsByPlaceQry.format(placeIds, filter);
        return endpoint.getObjects(qry, pageSize);
    };

    this.getByPersonId = function(id, pageSize) {
        var qry;
        if (_.isArray(id)) {
            id = '<{0}>'.format(id.join('> <'));
        } else if (id) {
            id = '<{0}>'.format(id);
        } else {
            return $q.when();
        }
        qry = byPersonQry.format(id);
        return endpoint.getObjects(qry, pageSize);
    };

    this.getByUnitId = function(id, pageSize) {
        if (_.isArray(id)) {
            id = '<{0}>'.format(id.join('> <'));
        } else if (id) {
            id = '<{0}>'.format(id);
        } else {
            return $q.when();
        }
        var qry = eventsByActorQry.format(id);
        return endpoint.getObjects(qry, pageSize);
    };

    this.getUnitAndSubUnitEventsByUnitId = function(id, pageSize) {
        if (_.isArray(id)) {
            id = '<{0}>'.format(id.join('> <'));
        } else if (id) {
            id = '<{0}>'.format(id);
        } else {
            return $q.when();
        }
        var qry = eventsAndSubUnitEventsByUnitQry.format(id);
        return endpoint.getObjects(qry, pageSize);
    };

    this.getPersonLifeEvents = function(id, pageSize) {
        var qry;
        if (_.isArray(id)) {
            id = '<{0}>'.format(id.join('> <'));
        } else if (id) {
            id = '<{0}>'.format(id);
        } else {
            return $q.when();
        }
        qry = personLifeEventsQry.format(id);
        return endpoint.getObjects(qry, pageSize);
    };

    this.getMinimalDataWithPlaceByUnitId = function(id, pageSize) {
        if (_.isArray(id)) {
            id = '<{0}>'.format(id.join('> <'));
        } else if (id) {
            id = '<{0}>'.format(id);
        } else {
            return $q.when();
        }
        var qry = unitEventQry.format(id);
        return endpoint.getObjects(qry, pageSize);
    };
});

