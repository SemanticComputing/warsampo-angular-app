'use strict';

/*
 * Service that provides an interface for fetching times from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
    .service('timeService', function($q, SparqlService, timeMapperService, Time,
                casualtyService, eventService, photoService) {

        Time.prototype.fetchEvents = function() {
            var self = this;
            return eventService.getEventsLooselyWithinTimeSpan(self.bob, self.eoe)
                .then(function(events) {
                    self.events = events;
            });
        };

        Time.prototype.fetchPhotos = function() {
            var self = this;
            return photoService.getByTimeSpan(self.bob, self.eoe)
                .then(function(photos) {
                    self.photos = photos;
            });
        };

        Time.prototype.fetchRelated = function() {
            var self = this;
            return self.fetchEvents()
                .then(function() { return self.fetchPhotos(); })
                .then(function() {
                    if (self.events) {
                        self.hasLinks = true;
                    }
                });
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

        var allQry = prefixes +
            ' SELECT ?id ?bob ?eoe ?label ' +
            ' WHERE { ' +
            '   GRAPH <http://ldf.fi/warsa/events/times> { ' +
            '     ?id crm:P82a_begin_of_the_begin ?bob ; ' +
            '       crm:P82b_end_of_the_end ?eoe . ' +
            '       skos:prefLabel ?label ; ' +
            '   } ' +
            ' } ' +
            ' ORDER BY ?bob ?eoe ';

        var byIdQry = prefixes +
            ' SELECT ?id ?bob ?eoe ?label ' +
            ' WHERE { ' +
            '   GRAPH <http://ldf.fi/warsa/events/times> { ' +
            '     VALUES ?id { {0} } ' +
            '     ?id crm:P82a_begin_of_the_begin ?bob ; ' +
            '       crm:P82b_end_of_the_end ?eoe ; ' +
            '       skos:prefLabel ?label ; ' +
            '   } ' +
            ' } ' +
            ' ORDER BY ?bob ?eoe ';

        this.getAll = function() {
            // Get all events.
            // Returns a promise.
            return endpoint.getObjects(allQry).then(function(data) {
                return timeMapperService.makeObjectList(data);
            });
        };

        this.getById = function(id) {
            return endpoint.getObjects(byIdQry.format('<' + id + '>')).then(function(data) {
                if (data.length) {
                    return timeMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Failed to get TimeSpan");
            });
        };
});

