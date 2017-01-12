(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching events from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('eventRepository', eventRepository);

    function eventRepository($q, _, baseRepository, AdvancedSparqlService, eventMapperService,
            translateableObjectMapperService, QueryBuilderService, dateUtilService, ENDPOINT_CONFIG) {

        this.getById = getById;
        this.getByTimeSpan = getByTimeSpan;
        this.getLooselyWithinTimeSpan = getLooselyWithinTimeSpan;
        this.getLooselyWithinTimeSpanFilterById = getLooselyWithinTimeSpanFilterById;
        this.getByPlaceId = getByPlaceId;
        this.getByPlaceIdFilterById = getByPlaceIdFilterById;
        this.getByPersonId = getByPersonId;
        this.getByUnitId = getByActorId;
        this.getUnitAndSubUnitEventsByUnitId = getUnitAndSubUnitEventsByUnitId;
        this.getPersonLifeEvents = getPersonLifeEvents;
        this.getByActorId = getByActorId;
        this.getTypesByActorId = getTypesByActorId;

        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, eventMapperService);
        var typeEndpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, translateableObjectMapperService);

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
        ' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
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

        var queryBuilder = new QueryBuilderService(prefixes);

        var orderBy = ' ?start_time ?end_time ';

        var select =
        ' SELECT DISTINCT ?id ?type ?type_id ?description (?description AS ?label) ?time_id ' +
        '  ?start_time ?end_time ?municipality_id ?participant_id ?participant_role ' +
        '  ?title ?place_id ?medal__id ?medal__label ?source ?photo_id ';

        var eventTypeFilter =
        ' FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/TroopMovement>) ' +
        ' FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/Battle>) ' +
        ' FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/Disappearing>) ' +
        ' FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/Wounding>) ' +
        ' FILTER(?type_id != <http://www.cidoc-crm.org/cidoc-crm/E67_Birth>) ';

        var singleEventQry = prefixes + select +
        ' { ' +
        '   VALUES ?id { {0} } ' +
        '   ?type_id rdfs:subClassOf* crm:E5_Event . ' +
        '   ?id a ?type_id . ' +
        '   ?type_id skos:prefLabel ?type . ' +
        '   ?id skos:prefLabel ?description . ' +
        '   OPTIONAL { ' +
        '     ?part_pred rdfs:subPropertyOf* crm:P11_had_participant . ' +
        '     ?id ?part_pred ?participant_id . ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    ?id dc:source|dct:source ?source_id . ' +
        '    ?source_id skos:prefLabel ?source . ' +
        '    FILTER(langMatches(lang(?source), "FI"))  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    ?id crm:P7_took_place_at ?place_id .  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    ?id crm:P94_has_created ?photo_id .  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id crm:P4_has_time-span ?time_id . ' +
        '     ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
        '       crm:P82b_end_of_the_end ?end_time . ' +
        '   } ' +
        ' } ' +
        ' ORDER BY ?start_time ?end_time ';

        var eventQryResultSet =
        ' GRAPH <http://ldf.fi/warsa/events> { ' +
        '   ?id a ?type_id . ' +
        '   {0} ' + // Placeholder for type filter
        ' } ' +
        ' ?id crm:P4_has_time-span ?time_id . ' +
        ' ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
        '    crm:P82b_end_of_the_end ?end_time . ' +
        ' {1} ' + // Placeholder for time filter
        ' ?id skos:prefLabel ?description . ';

        var eventQry = select +
        ' { ' +
        '   <RESULT_SET> ' +
        '   ?id a ?type_id . ' +
        '   ?type_id skos:prefLabel ?type . ' +
        '   ?id crm:P4_has_time-span ?time_id . ' +
        '   ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
        '      crm:P82b_end_of_the_end ?end_time . ' +
        '   ?id skos:prefLabel ?description . ' +
        '   OPTIONAL { ' +
        '    ?id dc:source|dct:source ?source_id . ' +
        '    ?source_id skos:prefLabel ?source . ' +
        '    FILTER(langMatches(lang(?source), "FI"))  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    ?id crm:P94_has_created ?photo_id .  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?part_pred rdfs:subPropertyOf* crm:P11_had_participant . ' +
        '     ?id ?part_pred ?participant_id . ' +
        '   } ' +
        '   OPTIONAL { ?id events:hadCommander ?commander . } ' +
        '   OPTIONAL { ?id crm:P7_took_place_at ?place_id . } ' +
        ' } ';

        /* Special case for retrieving all event types for an actor */

        var typesByActorQryResultSet =
        ' VALUES ?person { <ACTOR> } ' +
        ' ?part_pred rdfs:subPropertyOf* crm:P11_had_participant . ' +
        ' ?event ?part_pred ?person . ' +
        ' ?event a ?id . ' +
        ' ?event crm:P4_has_time-span [ ' +
        '   crm:P82a_begin_of_the_begin ?start_time ; ' +
        '   crm:P82b_end_of_the_end ?end_time ' +
        ' ] . ' +
        ' ?id skos:prefLabel ?label  . ';

        var typesByActorQry =
        ' SELECT DISTINCT ?id ?label ' +
        ' { ' +
        '   <RESULT_SET> ' +
        '   ?id skos:prefLabel ?label . ' +
        ' } ';

        /* ---- */

        var eventsByPlaceQryResultSet =
        ' GRAPH <http://ldf.fi/warsa/events> { ' +
        '   VALUES ?place_id { {0} } ' +
        '   {1} ' + // Placeholder for id filter
        '   ?id crm:P7_took_place_at ?place_id .  ' +
        '   ?id crm:P4_has_time-span ?time_id . ' +
        '   ?id a ?type_id . ' +
        ' } ' +
          eventTypeFilter;

        var eventsByActorQryResultSet =
        ' VALUES ?participant_id { <ACTOR> }  ' +
        ' ?part_pred rdfs:subPropertyOf* crm:P11_had_participant . ' +
        ' ?id ?part_pred ?participant_id . ' +
        ' ?id a ?type_id . ' +
        ' ?id crm:P4_has_time-span [ ' +
        '   crm:P82a_begin_of_the_begin ?start_time ; ' +
        '   crm:P82b_end_of_the_end ?end_time ' +
        ' ] . ';

        var eventsAndSubUnitEventsByUnitQryResultSet =
        ' { ' +
        '   VALUES ?participant_id { {0} } ' +
        '   { ' +
        '       ?id a crm:E66_Formation ; ' +
        '           crm:P95_has_formed ?participant_id . ' +
        '   } UNION { ' +
        '       ?id a etypes:TroopMovement ; ' +
        '           crm:P95_has_formed ?participant_id . ' +
        '   } ' +
        ' } UNION { ' +
        '   { ' +
        '     SELECT DISTINCT ?participant_id { ' +
        '       VALUES ?unit { {0} } . ' +
        '       ?unit (^crm:P144_joined_with/crm:P143_joined)+ ?participant_id . ' +
        '       ?participant_id a atypes:MilitaryUnit . ' +
        '     } ' +
        '   } UNION { ' +
        '     VALUES ?participant_id { {0} } ' +
        '   } ' +
        '   { ' +
        '     ?id crm:P11_had_participant ?participant_id . ' +
        '   } UNION { ' +
        '       VALUES ?participant_id { {0} } . ' +
        '       ?id crm:P11_had_participant ?participant_id . ' +
        '   } ' +
        '   { ?id a etypes:Battle . } UNION { ?id a etypes:Photography } ' +
        ' } ' +
        ' ?id crm:P4_has_time-span ?time_id . ' +
        ' ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
        '      crm:P82b_end_of_the_end ?end_time . ' +
        ' FILTER (?start_time<=?end_time) . ';

        // TODO: harmonize
        var byPersonQry = prefixes + select +
        ' { ' +
        '  VALUES ?person { {0} } . ' +
        '  { ' +
        '   GRAPH <http://ldf.fi/warsa/events> { ' +
        '    ?id crm:P11_had_participant ?person ; ' +
        '    	skos:prefLabel ?description . ' +
        '    	OPTIONAL { ?id events:hadUnit ?unit . } ' +
        '   }' +
        '  }' +
        '  UNION  ' +
        '  { ?id a etypes:PersonJoining . ?id crm:P143_joined ?person . ' +
        '    ?id crm:P107_1_kind_of_member ?participant_role .  ' +
        '    ?id crm:P144_joined_with ?unit . ' +
        '    ?unit skos:prefLabel ?description . '+
        '  }  '+
        '  UNION '+
        '  { '+
        '   ?id a articles:Article ; '+
        '    dct:hasFormat ?link ; '+
        '    dc:title ?description ; '+
        '   { ?id dct:subject ?person . }  '+
        '   UNION  '+
        '   { ?id articles:nerperson ?person . }  '+
        '   UNION  '+
        '   { ?author skos:relatedMatch ?person . ?id articles:author ?author . } '+
        '  } ' +
        '  UNION  '+
        '  { ' +
        '    ?id crm:P11_had_participant ?person ; ' +
        '     crm:P141_assigned ?medal__id . ' +
        '    ?medal__id skos:prefLabel ?medal__label . ' +
        '  } ' +
        '  ?id a ?type_id . ' +
        '  OPTIONAL { ' +
        '    ?type_id skos:prefLabel ?type . ' +
        '  } ' +
        '  OPTIONAL { ' +
        '    ?id crm:P4_has_time-span ?time_id .  ' +
        '    ?time_id crm:P82a_begin_of_the_begin ?start_time ;  ' +
        '     crm:P82b_end_of_the_end ?end_time .  ' +
        '  } ' +
        '  OPTIONAL { ?id crm:P7_took_place_at ?place_id . } ' +
        ' } ORDER BY ?start_time ?end_time ';

        // TODO: harmonize
        var personLifeEventsQry = prefixes +
        ' SELECT DISTINCT ?id ?type ?type_id ?time_id ?description (?description AS ?label) ' +
        '  ?start_time ?end_time ?rank__label ?rank__id ?place_id ' +
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
        '   crm:P11_had_participant ?person ; ' +
        '   actors:hasRank ?rank__id . ' +
        '   ?rank__id skos:prefLabel ?rank__label . ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id crm:P4_has_time-span ?time_id .  ' +
        '   ?time_id crm:P82a_begin_of_the_begin ?start_time . ' +
        '   ?time_id crm:P82b_end_of_the_end ?end_time . ' +
        '  } ' +
        '  OPTIONAL { ?id crm:P7_took_place_at ?place_id . } ' +
        '  ?id a ?type_id . ' +
        '  OPTIONAL { ?id skos:prefLabel ?description . } ' +
        '  OPTIONAL { ' +
        '    ?type_id skos:prefLabel ?type . ' +
        '  } ' +
        ' } ORDER BY ?start_time  ';

        var eventFilterWithinTimeSpan =
        'FILTER(?start_time >= "{0}"^^xsd:date && ?end_time <= "{1}"^^xsd:date)';

        var eventsWithinTimeSpanResultSet = eventQryResultSet.format(eventTypeFilter,
                eventFilterWithinTimeSpan);

        var eventFilterWithinTimeSpanRelaxed =
        'FILTER( ' +
        '   ?start_time <= "{1}"^^xsd:date && ' +
        '   ?end_time >= "{0}"^^xsd:date ' +
        ')';

        var eventsWithinRelaxedTimeSpanResultSet = eventQryResultSet.format(eventTypeFilter,
            eventFilterWithinTimeSpanRelaxed);

        function getByTimeSpan(start, end, pageSize) {
            // Get events that occured between the dates start and end (inclusive).
            // Returns a promise.
            var resultSet = eventsWithinTimeSpanResultSet.format(start, end);
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query,
                pageSize, qryObj.resultSetQuery);
        }

        function getById(id) {
            var qry = singleEventQry.format('<' + id + '>');
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return (data)[0];
                }
                return $q.reject('Does not exist');
            });
        }

        function getLooselyWithinTimeSpan(start, end, pageSize) {
            // Get events that at least partially occured between the dates start and end.
            // Returns a promise.
            var resultSet = eventsWithinRelaxedTimeSpanResultSet.format(start, end);
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getLooselyWithinTimeSpanFilterById(start, end, id, pageSize) {
            // Get events that at least partially occured between the dates start and end.
            // Filter out the given id.
            // Returns a promise.
            var resultSet = eventQryResultSet
                .format(eventTypeFilter + 'FILTER(?id != {0})'
                    .format('<' + id + '>'), eventFilterWithinTimeSpanRelaxed)
                .format(start, end);
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getByPlaceId(id, pageSize) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = eventsByPlaceQryResultSet.format(id, '');
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getByPlaceIdFilterById(placeIds, id, pageSize) {
            placeIds = baseRepository.uriFy(placeIds);
            id = baseRepository.uriFy(id);
            if (!(id && placeIds)) {
                return $q.when();
            }
            var filter = 'FILTER(?id != {0})'.format(id);
            var resultSet = eventsByPlaceQryResultSet.format(placeIds, filter);
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getByPersonId(id) {
            // No paging support
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = byPersonQry.format(id);
            return endpoint.getObjects(qry);
        }

        function getByActorId(id, options) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = eventsByActorQryResultSet.replace('<ACTOR>', id);
            resultSet = addTypeFilters(resultSet, options.types);
            resultSet = addDateFilters(resultSet, options.start, options.end);
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function addTypeFilters(qry, types) {
            types = baseRepository.uriFy(types);
            if (types) {
                qry += ' VALUES ?type_id { ' + types + ' } ';
            }
            return qry;
        }

        function addDateFilters(qry, start, end) {
            var format = 'yyyy-MM-dd';
            if (start) {
                start = dateUtilService.formatDate(start, format);
                qry += ' FILTER(?start_time <= "' + end + '"^^xsd:date)';
            }
            if (end) {
                end = dateUtilService.formatDate(end, format);
                qry += ' FILTER(?end_time >= "' + start + '"^^xsd:date)';
            }
            return qry;
        }

        function getUnitAndSubUnitEventsByUnitId(id, pageSize) {
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = eventsAndSubUnitEventsByUnitQryResultSet.format(id);
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, pageSize, qryObj.resultSetQuery);
        }

        function getPersonLifeEvents(id) {
            // No paging support
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = personLifeEventsQry.format(id);
            return endpoint.getObjects(qry);
        }

        function getTypesByActorId(id, options) {
            options = options || {};
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = typesByActorQryResultSet.replace('<ACTOR>', id);
            resultSet = addDateFilters(resultSet, options.start, options.end);
            var qryObj = queryBuilder.buildQuery(typesByActorQry, resultSet, options.orderBy);
            return typeEndpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }
    }
})();
