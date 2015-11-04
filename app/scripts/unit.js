'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('unitService', function($q, SparqlService, unitMapperService,
                Unit, eventService) {

        Unit.prototype.fetchRelatedEvents = function() {
            var self = this;
            return eventService.getEventsByActor(self.id).then(function(events) {
                self.relatedEvents = events;
            });
        };
        
        Unit.prototype.fetchRelated = function() {
            var self = this;
            return self.fetchRelatedEvents().then(function() {
                if (self.relatedEvents) {
                    self.hasLinks = true;
                }
            });
        };


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

        var unitQry = prefixes + hereDoc(function() {/*!
            SELECT DISTINCT ?id ?name ?abbrev ?note WHERE { 
                ?ename a etypes:UnitNaming .
                ?ename skos:prefLabel ?name .
                OPTIONAL {?ename skos:altLabel ?abbrev . }
                ?ename crm:P95_has_formed ?id .
                OPTIONAL {?id crm:P3_has_note ?note . }
        
                VALUES ?id  { {0} }
            } 
        */});
        this.getById = function(id) {
            var qry = unitQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return unitMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Does not exist");
            });
        };

});

