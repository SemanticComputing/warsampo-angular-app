(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching events from the WarSa SPARQL endpoint.
    */
    angular.module('eventsApp')
    .service('eventRepository', eventRepository);

    /* @ngInject */
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
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
        ' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
        ' PREFIX sch: <http://schema.org/>' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX wevs: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ' +
        ' PREFIX wacs: <http://ldf.fi/schema/warsa/actors/> ' +
        ' PREFIX wars: <http://ldf.fi/schema/warsa/articles/> ';

        var queryBuilder = new QueryBuilderService(prefixes);

        var orderBy = ' ?start_time ?end_time ';

        var select =
        ' SELECT DISTINCT ?id ?type ?type_id ?description ?label ?time_id ' +
        '  ?start_time ?end_time ?municipality_id ?participant_id ?participant_role ' +
        '  ?title ?place_id ?medal__id ?medal__label ?source ?photo_id ';

        var eventTypeFilter =
        ' FILTER(?type_id NOT IN ( ' +
        '  wsc:TroopMovement, ' +
        '  wsc:Dissolution, ' +
        '  wsc:Battle, ' +
        '  wsc:Disappearing, ' +
        '  wsc:Wounding, ' +
        '  wsc:Birth ' +
        ' )) ';

        var singleEventQryResultSet =
        '   VALUES ?id { <ID> } ' +
        '   ?id a ?type_id . ' +
        '   ?type_id rdfs:subClassOf* wsc:Event . ';

        var singleEventQry = prefixes + select +
        ' { ' +
        '   <RESULT_SET> ' +
        '   ?id a ?type_id . ' +
        '   ?type_id skos:prefLabel ?type . ' +
        '   ?id skos:prefLabel ?label . ' +
        '   OPTIONAL { ?id dct:description ?description . } ' +
        '   OPTIONAL { ' +
        '     ?part_pred rdfs:subPropertyOf* crm:P11_had_participant . ' +
        '     ?id ?part_pred ?participant_id . ' +
        '   } ' +
        '   OPTIONAL { ' +
        '    ?id dct:source ?source_id . ' +
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
        '     ?time_id crm:P82a_begin_of_the_begin ?start_t ; ' +
        '       crm:P82b_end_of_the_end ?end_t . ' +
        '     BIND(xsd:dateTime(?start_t) AS ?start_time) ' +
        '     BIND(xsd:dateTime(?end_t) AS ?end_time) ' +
        '   } ' +
        ' } ' +
        ' ORDER BY ?start_time ?end_time ';

        var eventQryResultSet =
        ' GRAPH <http://ldf.fi/warsa/events> { ' +
        '   ?id a ?type_id . ' +
        '   <TYPE_FILTER> ' +
        ' } ' +
        ' ?id crm:P4_has_time-span ?time_id . ' +
        ' ?time_id crm:P82a_begin_of_the_begin ?start_t ; ' +
        '    crm:P82b_end_of_the_end ?end_t . ' +
        ' BIND(xsd:dateTime(?start_t) AS ?start_time) ' +
        ' BIND(xsd:dateTime(?end_t) AS ?end_time) ' +
        ' <TIME_FILTER> ' +
        ' ?id skos:prefLabel ?label . ';

        var eventQry = select +
        ' { ' +
        '   <RESULT_SET> ' +
        '   ?id a ?type_id . ' +
        '   ?type_id skos:prefLabel ?type . ' +
        '   ?id crm:P4_has_time-span ?time_id . ' +
        '   ?time_id crm:P82a_begin_of_the_begin ?start_t ; ' +
        '      crm:P82b_end_of_the_end ?end_t . ' +
        '   BIND(xsd:dateTime(?start_t) AS ?start_time) ' +
        '   BIND(xsd:dateTime(?end_t) AS ?end_time) ' +
        '   ?id skos:prefLabel ?label . ' +
        '   OPTIONAL { ?id dct:description ?description . } ' +
        '   OPTIONAL { ' +
        '    ?id dct:source ?source_id . ' +
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
        '   OPTIONAL { ?id wevs:hadCommander ?commander . } ' +
        '   OPTIONAL { ?id crm:P7_took_place_at ?place_id . } ' +
        ' } ';

        /* Special case for retrieving all event types for an actor */

        var typesByActorQryResultSet =
        ' VALUES ?person { <ACTOR> } ' +
        ' ?part_pred rdfs:subPropertyOf* crm:P11_had_participant . ' +
        ' ?event ?part_pred ?person . ' +
        ' ?event a ?id . ' +
        ' ?event crm:P4_has_time-span [ ' +
        '   crm:P82a_begin_of_the_begin ?start_t ; ' +
        '   crm:P82b_end_of_the_end ?end_t ' +
        ' ] . ' +
        ' BIND(xsd:dateTime(?start_t) AS ?start_time) ' +
        ' BIND(xsd:dateTime(?end_t) AS ?end_time) ' +
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
        '   VALUES ?place_id { <PLACE> } ' +
        '   <ID_FILTER> ' +
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
        '   crm:P82a_begin_of_the_begin ?start_t ; ' +
        '   crm:P82b_end_of_the_end ?end_t ' +
        ' ] . ' +
        ' BIND(xsd:dateTime(?start_t) AS ?start_time) ' +
        ' BIND(xsd:dateTime(?end_t) AS ?end_time) ';

        var eventsAndSubUnitEventsByUnitQryResultSet =
        ' { ' +
        '   { ' +
        '     SELECT DISTINCT ?participant_id { ' +
        '       VALUES ?unit { <ID> } . ' +
        '       ?unit (^crm:P144_joined_with/crm:P143_joined)+ ?participant_id . ' +
        '       ?participant_id a/rdfs:subClassOf* wsc:Group . ' +
        '     } ' +
        '   } UNION { ' +
        '     VALUES ?participant_id { <ID> } ' +
        '   } ' +
        '   ?part_pred rdfs:subPropertyOf* crm:P11_had_participant . ' +
        '   ?id ?part_pred ?participant_id . ' +
        ' } ' +
        ' ?id crm:P4_has_time-span ?time_id . ' +
        ' ?time_id crm:P82a_begin_of_the_begin ?start_t ; ' +
        '      crm:P82b_end_of_the_end ?end_t . ' +
        ' BIND(xsd:dateTime(?start_t) AS ?start_time) ' +
        ' BIND(xsd:dateTime(?end_t) AS ?end_time) ' +
        ' FILTER (?start_time<=?end_time) . ';

        // TODO: harmonize
        var byPersonQry = prefixes + select +
        ' { ' +
        '  VALUES ?person { <PERSON> } . ' +
        '  { ' +
        '   GRAPH <http://ldf.fi/warsa/events> { ' +
        '    ?id crm:P11_had_participant ?person ; ' +
        '    	skos:prefLabel ?label . ' +
        '       OPTIONAL { ?id dct:description ?description } . ' +
        '    	OPTIONAL { ?id wevs:hadUnit ?unit . } ' +
        '   }' +
        '  }' +
        '  UNION  ' +
        '  { ?id a wsc:PersonJoining . ?id crm:P143_joined ?person . ' +
        '    ?id crm:P107_1_kind_of_member ?participant_role .  ' +
        '    ?id crm:P144_joined_with ?unit . ' +
        '    ?unit skos:prefLabel ?label . '+
        '    BIND(?label AS ?description) . '+
        '  }  '+
        '  UNION '+
        '  { '+
        '   ?id a wsc:Article ; '+
        '    dct:hasFormat ?link ; '+
        '    dc:title|dct:title ?label ; '+
        '    BIND(?label AS ?description) . '+
        '   { ?id dct:subject ?person . }  '+
        '   UNION  '+
        '   { ?id wars:mentionsPerson ?person . }  '+
        '   UNION  '+
        '   { ?author skos:relatedMatch ?person . ?id wars:author ?author . } '+
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
        '    ?time_id crm:P82a_begin_of_the_begin ?start_t ;  ' +
        '     crm:P82b_end_of_the_end ?end_t .  ' +
        '    BIND(xsd:dateTime(?start_t) AS ?start_time) ' +
        '    BIND(xsd:dateTime(?end_t) AS ?end_time) ' +
        '  } ' +
        '  OPTIONAL { ?id crm:P7_took_place_at ?place_id . } ' +
        ' } ORDER BY ?start_time ?end_time ';

        // TODO: harmonize
        var personLifeEventsQry = prefixes +
        ' SELECT DISTINCT ?id ?type ?type_id ?time_id ?description ?label ' +
        '  ?start_time ?end_time ?rank__label ?rank__id ?place_id ' +
        ' { ' +
        '  VALUES ?person { <PERSON> } ' +
        '  { ?id a wsc:Birth ; crm:P98_brought_into_life ?person . } ' +
        '  UNION  ' +
        '  { ?id a wsc:Death ; crm:P100_was_death_of ?person . } ' +
        '  UNION  ' +
        '  { ?id a wsc:Disappearing ; crm:P11_had_participant ?person . } ' +
        '  UNION  ' +
        '  { ?id a wsc:Wounding ; crm:P11_had_participant ?person . } ' +
        '  UNION  ' +
        '  { ?id a wsc:Promotion ; ' +
        '   crm:P11_had_participant ?person ; ' +
        '     wacs:hasRank ?rank__id . ' +
        '   ?rank__id skos:prefLabel ?rank__label . ' +
        '  } ' +
        '  OPTIONAL { ' +
        '   ?id crm:P4_has_time-span ?time_id .  ' +
        '   ?time_id crm:P82a_begin_of_the_begin ?start_t . ' +
        '   BIND(xsd:dateTime(?start_t) AS ?start_time) ' +
        '   ?time_id crm:P82b_end_of_the_end ?end_t . ' +
        '   BIND(xsd:dateTime(?end_t) AS ?end_time) ' +
        '  } ' +
        '  OPTIONAL { ?id crm:P7_took_place_at ?place_id . } ' +
        '  ?id a ?type_id . ' +
        '  OPTIONAL { ?id skos:prefLabel ?label . } ' +
        '  OPTIONAL { ?id dct:description ?description . } ' +
        '  OPTIONAL { ' +
        '    ?type_id skos:prefLabel ?type . ' +
        '  } ' +
        ' } ORDER BY ?start_time  ';

        var eventFilterWithinTimeSpan =
        'FILTER(?start_time >= "<DATE_START>T00:00:00"^^xsd:dateTime && ?end_time <= "<DATE_END>T23:59:59"^^xsd:dateTime)';

        var eventsWithinTimeSpanResultSet = eventQryResultSet
            .replace('<TYPE_FILTER>', eventTypeFilter)
            .replace('<TIME_FILTER>', eventFilterWithinTimeSpan);

        var eventFilterWithinTimeSpanRelaxed =
        'FILTER( ' +
        '   ?end_time >= "<DATE_START>T00:00:00"^^xsd:dateTime && ' +
        '   ?start_time <= "<DATE_END>T23:59:59"^^xsd:dateTime ' +
        ')';

        var eventsWithinRelaxedTimeSpanResultSet = eventQryResultSet
            .replace('<TYPE_FILTER>', eventTypeFilter)
            .replace('<TIME_FILTER>', eventFilterWithinTimeSpanRelaxed);

        function getByTimeSpan(start, end, options) {
            options = options || {};
            // Get events that occured between the dates start and end (inclusive).
            // Returns a promise.
            var resultSet = eventsWithinTimeSpanResultSet
                .replace('<DATE_START>', start)
                .replace('<DATE_END>', end);
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query,
                options.pageSize, qryObj.resultSetQuery);
        }

        function getById(ids, options) {
            options = options || {};
            ids = baseRepository.uriFy(ids);
            if (!ids) {
                return $q.when();
            }
            var resultSet = singleEventQryResultSet.replace('<ID>', ids);
            var qryObj = queryBuilder.buildQuery(singleEventQry, resultSet);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getLooselyWithinTimeSpan(start, end, options) {
            // Get events that at least partially occured between the dates start and end.
            // Returns a promise.
            options = options || {};
            var resultSet = eventsWithinRelaxedTimeSpanResultSet
                .replace('<DATE_START>', dateUtilService.formatDate(start, 'yyyy-MM-dd'))
                .replace('<DATE_END>', dateUtilService.formatDate(end, 'yyyy-MM-dd'));
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getLooselyWithinTimeSpanFilterById(start, end, id, options) {
            // Get events that at least partially occured between the dates start and end.
            // Filter out the given id.
            // Returns a promise.
            options = options || {};
            var resultSet = eventQryResultSet
                .replace('<TYPE_FILTER>', eventTypeFilter + 'FILTER(?id != <' + id + '>)')
                .replace('<TIME_FILTER>', eventFilterWithinTimeSpanRelaxed
                    .replace('<DATE_START>', dateUtilService.formatDate(start, 'yyyy-MM-dd'))
                    .replace('<DATE_END>', dateUtilService.formatDate(end, 'yyyy-MM-dd')));
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getByPlaceId(id, options) {
            options = options || {};
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = eventsByPlaceQryResultSet.replace('<PLACE>', id).replace('<ID_FILTER>', '');
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getByPlaceIdFilterById(placeIds, id, options) {
            options = options || {};
            placeIds = baseRepository.uriFy(placeIds);
            id = baseRepository.uriFy(id);
            if (!(id && placeIds)) {
                return $q.when();
            }
            var filter = 'FILTER(?id != ' + id + ')';
            var resultSet = eventsByPlaceQryResultSet
                .replace('<PLACE>', placeIds)
                .replace('<ID_FILTER>', filter);
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getByPersonId(id) {
            // No paging support
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = byPersonQry.replace('<PERSON>', id);
            return endpoint.getObjects(qry);
        }

        function getByActorId(id, options) {
            options = options || {};
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
                qry += ' FILTER(?start_time <= "' + end + 'T00:00:00"^^xsd:dateTime)';
            }
            if (end) {
                end = dateUtilService.formatDate(end, format);
                qry += ' FILTER(?end_time >= "' + start + 'T23:59:59"^^xsd:dateTime)';
            }
            return qry;
        }

        function getUnitAndSubUnitEventsByUnitId(id, options) {
            options = options || {};
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var resultSet = eventsAndSubUnitEventsByUnitQryResultSet.replace(/<ID>/g, id);
            var qryObj = queryBuilder.buildQuery(eventQry, resultSet, orderBy);
            return endpoint.getObjects(qryObj.query, options.pageSize, qryObj.resultSetQuery);
        }

        function getPersonLifeEvents(id) {
            // No paging support
            id = baseRepository.uriFy(id);
            if (!id) {
                return $q.when();
            }
            var qry = personLifeEventsQry.replace('<PERSON>', id);
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
