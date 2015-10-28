'use strict';

/*
 * Service that provides an interface for fetching events from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
    .service('eventService', function($q, SparqlService, eventMapperService, Event,
                casualtyService, actorService) {

        Event.prototype.fetchCasualties = function() {
            var self = this;
            return casualtyService.getCasualtyInfo(self.participant_id)
                .then(function(participants) {
                    self.relatedCasualties = participants;
            });
        };

        Event.prototype.fetchActors = function() {
            var self = this;
            return actorService.getActorInfo(self.participant_id).then(function(actors) {
                self.actors = actors;
            });
        };

        Event.prototype.fetchRelated = function() {
            var self = this;
            return self.fetchCasualties().then(function() { return self.fetchActors(); });
        };

        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var prefixes = '' +
            ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
            ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
            ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
            ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
            ' PREFIX sch: <http://schema.org/>' +
            ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
            ' PREFIX suo: <http://www.yso.fi/onto/suo/> ';

        var singleEventQry = prefixes +
            ' SELECT ?id ?start_time ?end_time ?time_id ?description ?place_label ?place_id ' +
            '           ?municipality ?lat ?lon ?polygon ?type ?participant  ' +
            ' WHERE { ' +
            '   VALUES ?id { {0} } ' +
            '   ?id crm:P4_has_time-span ?time_id ; ' +
            '       a ?type_id . ' +
            '       FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/TroopMovement>) ' +
            '       FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/Battle>) ' +
            '       ?id skos:prefLabel ?description . ' +
            '    OPTIONAL { ?id crm:P11_had_participant ?participant . } ' +
            '    OPTIONAL { ?id crm:P7_took_place_at ?place_id .  ' +
            '      ?place_id skos:prefLabel ?place_label . ' +
            '      OPTIONAL { ?place_id sch:polygon ?polygon . } ' +
            '      OPTIONAL { ' +
            '            ?place_id geo:lat ?lat ; ' +
            '              geo:long ?lon . ' +
            '      } ' +
            '      OPTIONAL { ' +
            '           GRAPH <http://ldf.fi/places/karelian_places> { ' +
            '               ?place_id geosparql:sfWithin ?municipality . ' +
            '           } ' +
            '           GRAPH <http://ldf.fi/places/municipalities> { ' +
            '               ?municipality a suo:kunta . ' +
            '           } ' +
            '      } ' +
            '   } ' +
            '   GRAPH <http://ldf.fi/warsa/events/times> { ' +
            '     ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
            '              crm:P82b_end_of_the_end ?end_time . ' +
            '   } ' +
            '   GRAPH <http://ldf.fi/warsa/events/event_types> { ' +
            '     ?type_id skos:prefLabel ?type . ' +
            '     FILTER(langMatches(lang(?type), "FI"))  ' +
            '  ' +
            '   } ' +
            ' } ' +
            ' ORDER BY ?start_time ?end_time ';

        var eventQry = prefixes +
            ' SELECT ?id ?start_time ?end_time ?time_id ?description ?place_label ' +
            '           ?place_id ?municipality ?lat ?lon ?polygon ?type ?participant  ' +
            ' WHERE { ' +
            '   ?id crm:P4_has_time-span ?time_id ; ' +
            '       a ?type_id . ' +
            '       FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/TroopMovement>) ' +
            '       FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/Battle>) ' +
            '       ?id skos:prefLabel ?description . ' +
            '    OPTIONAL { ?id crm:P11_had_participant ?participant . } ' +
            '    OPTIONAL { ?id crm:P7_took_place_at ?place_id .  ' +
            '      ?place_id skos:prefLabel ?place_label . ' +
            '      OPTIONAL { ?place_id sch:polygon ?polygon . } ' +
            '      OPTIONAL { ' +
            '            ?place_id geo:lat ?lat ; ' +
            '              geo:long ?lon . ' +
            '      } ' +
            '      OPTIONAL { ' +
            '           GRAPH <http://ldf.fi/places/karelian_places> { ' +
            '               ?place_id geosparql:sfWithin ?municipality . ' +
            '           } ' +
            '           GRAPH <http://ldf.fi/places/municipalities> { ' +
            '               ?municipality a suo:kunta . ' +
            '           } ' +
            '      } ' +
            '   } ' +
            '   GRAPH <http://ldf.fi/warsa/events/times> { ' +
            '     ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
            '              crm:P82b_end_of_the_end ?end_time . ' +
            '     {0} ' + // Placeholder for time filter
            '   } ' +
            '   GRAPH <http://ldf.fi/warsa/events/event_types> { ' +
            '     ?type_id skos:prefLabel ?type . ' +
            '     FILTER(langMatches(lang(?type), "FI"))  ' +
            '  ' +
            '   } ' +
            ' } ' +
            ' ORDER BY ?start_time ?end_time ';

        var eventsByPlaceQry = prefixes +
            ' SELECT ?id ?start_time ?end_time ?time_id ?description ?place_label ' +
            '           ?place_id ?municipality ?lat ?lon ?polygon ?type ?participant  ' +
            ' WHERE { ' +
            '   VALUES ?place_id { {0} } ' +
            '   ?id crm:P4_has_time-span ?time_id ; ' +
            '       a ?type_id . ' +
            '   FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/TroopMovement>) ' +
            '   FILTER(?type_id != <http://ldf.fi/warsa/events/event_types/Battle>) ' +
            '   ?id skos:prefLabel ?description ; ' +
            '       crm:P7_took_place_at ?place_id .  ' +
            '   ?place_id skos:prefLabel ?place_label . ' +
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
            '   GRAPH <http://ldf.fi/warsa/events/times> { ' +
            '     ?time_id crm:P82a_begin_of_the_begin ?start_time ; ' +
            '              crm:P82b_end_of_the_end ?end_time . ' +
            '   } ' +
            '   GRAPH <http://ldf.fi/warsa/events/event_types> { ' +
            '     ?type_id skos:prefLabel ?type . ' +
            '     FILTER(langMatches(lang(?type), "FI"))  ' +
            '  ' +
            '   } ' +
            ' } ' +
            ' ORDER BY ?start_time ?end_time ';

        var eventFilterWithinTimeSpan =
            'FILTER(?start_time >= "{0}"^^xsd:date && ?end_time <= "{1}"^^xsd:date)';

        var eventsWithinTimeSpanQry = eventQry.format(eventFilterWithinTimeSpan);

        var eventFilterWithinTimeSpanRelaxed = 
            'FILTER( ' +
            '   (?start_time >= "{0}"^^xsd:date && ' +
            '   ?start_time <= "{1}"^^xsd:date) || ' +
            '   (?end_time >= "{0}"^^xsd:date && ' +
            '   ?end_time <= "{1}"^^xsd:date) ' + 
            ')';

        var eventsWithinRelaxedTimeSpanQry = eventQry.format(eventFilterWithinTimeSpanRelaxed);

        var allEventsQry = eventQry.format("");

        this.getEventsByTimeSpan = function(start, end) {
            // Get events that occured between the dates start and end (inclusive).
            // Returns a promise.
            return endpoint.getObjects(eventsWithinTimeSpanQry.format(start, end)).then(function(data) {
                return eventMapperService.makeObjectList(data);
            });
        };

        this.getAllEvents = function() {
            // Get all events.
            // Returns a promise.
            return endpoint.getObjects(allEventsQry).then(function(data) {
                return eventMapperService.makeObjectList(data);
            });
        };

        this.getEventById = function(id) {
            return endpoint.getObjects(singleEventQry.format('<' + id + '>')).then(function(data) {
                if (data.length) {
                    return eventMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Does not exist");
            });
        };

        this.getEventsLooselyWithinTimeSpan = function(start, end) {
            // Get events that at least partially occured between the dates start and end.
            // Returns a promise.
            return endpoint.getObjects(
                    eventsWithinRelaxedTimeSpanQry.format(start, end)).then(function(data) {
                return eventMapperService.makeObjectList(data);
            });
        };

        this.getEventsByPlaceId = function(ids) {
            var qry;
            if (_.isArray(ids)) {
                ids = "<{0}>".format(ids.join("> <"));
            } else if (ids) {
                ids = "<{0}>".format(ids);
            } else {
                return $q.when();
            }
            qry = eventsByPlaceQry.format(ids);
            return endpoint.getObjects(qry).then(function(data) {
                return eventMapperService.makeObjectList(data);
            });
        };
});

