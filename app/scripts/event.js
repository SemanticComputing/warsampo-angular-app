'use strict';

/*
 * Service that provides an interface for fetching events from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
    .service('eventService', function(SparqlService, eventMapperService) {
        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var eventQry =
            ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
            ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
            ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>' +
            ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
            ' PREFIX sch: <http://schema.org/>' +
              
            ' SELECT ?id ?start_time ?end_time ?description ?place_label ?lat ?lon ?polygon ?type' +
            ' WHERE {' +
            '   ?type_id skos:prefLabel ?type .    ' +
            '   FILTER(langMatches(lang(?type), "FI"))' +
            '   ?id a ?type_id ;' +
            '         skos:prefLabel ?description ;' +
            '         crm:P4_has_time-span ?time_id ;' +
            '         crm:P7_took_place_at ?place_id .' +
            '     ?time_id crm:P82a_begin_of_the_begin ?start_time ;' +
            '         crm:P82b_end_of_the_end ?end_time .' +
            '     {0}' + // Placeholder for a filter
            '     OPTIONAL { ' +
            '         ?place_id geo:lat ?lat ;' +
            '         geo:long ?lon .' +
            '     }' +
            '     OPTIONAL { ?place_id sch:polygon ?polygon . }' +
            '     OPTIONAL { ?place_id skos:prefLabel ?place_label . }' +
            ' }' +
            ' ORDER BY ?start_time ?end_time';

        var eventFilterWithinTimeSpan =
            'FILTER(?start_time >= "{0}"^^xsd:date && ?end_time <= "{1}"^^xsd:date)';

        var eventsWithinTimeSpanQry = eventQry.format(eventFilterWithinTimeSpan);

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

        this.getExtremeDate = function(dates, min) {
            if (_.isArray(dates)) {
                var fun;
                if (min) {
                    fun = _.min;
                } else {
                    fun = _.max;
                }
                return new Date(fun(dates, function(date) {
                    return new Date(date);
                }));
            }
            if (!dates) {
                return undefined;
            }
            return new Date(dates);
        };

        this.isFullYear = function(start, end) {
            return start.getDate() === 1 && start.getMonth() === 0 && end.getDate() === 31 &&
                end.getMonth() === 11;
        };

        this.formatDateRange = function(start, end) {
            if (this.isFullYear(start, end)) {
                var start_year = start.getFullYear();
                var end_year = end.getFullYear();
                return start_year === end_year ? start_year : start_year + '-' + end_year;
            }
            if (end - start) {
                return start.toLocaleDateString() + '-' + end.toLocaleDateString();
            }
            return start.toLocaleDateString();
        };


        this.createTitle = function(event) {
            var start = this.getExtremeDate(event.start_time, true);
            var end = this.getExtremeDate(event.end_time, false);
            var time = this.formatDateRange(start, end);

            var place;
            if (_.isArray(event.place_label)) {
                place = event.place_label.join(", ");
            } else {
                place = event.place_label;
            }

            return place ? place + ' ' + time : time;
        };
});

