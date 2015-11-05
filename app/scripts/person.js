'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('personService', function($q, SparqlService, personMapperService,
                Person, eventService) {
        
        var personService = this;

        Person.prototype.fetchRelatedEvents = function() {
            var self = this;
            return eventService.getEventsByActor(self.id).then(function(events) {
                self.relatedEvents = events;
            });
        };
        
        Person.prototype.fetchRelated = function() {
            var self = this;
            return self.fetchRelatedEvents().then(function() { return self.fetchRelatedUnits(); }).then(function() {
                if (self.relatedEvents || self.relatedUnits) {
                    self.hasLinks = true;
                }
            });
        };
			
		  Person.prototype.fetchRelatedUnits = function() {
		  		var self = this;
            return unitService.getSuperunit(self.id).then(function(units) {
            	console.log(units);
            	if (_.isArray(units)) { units=units[0]; }
            	if (_.isArray(units.name)) { units.name=units.name[0]; }
               self.relatedUnits = [units];
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

        var personQry = prefixes + hereDoc(function() {/*!
				SELECT DISTINCT ?id ?sname ?fname ?note WHERE { 
			        ?id a atypes:MilitaryPerson ;
				          foaf:familyName ?sname ;
				          foaf:firstName  ?fname .
			        OPTIONAL {?id crm:P3_has_note ?note . }
			        VALUES ?id  { {0} }
				}  
        */});
        
        var relatedUnitQry = prefixes + hereDoc(function() {/*!
            SELECT DISTINCT ?id ?name ?abbrev WHERE { 
                ?ejoin a etypes:UnitJoining ;
                    crm:P143_joined ?unit ;
                    crm:P144_joined_with ?id .

                ?ename a etypes:UnitNaming ;
                     skos:prefLabel ?name ;
                     crm:P95_has_formed ?id .
                OPTIONAL {?ename skos:altLabel ?abbrev . }
                
                # OPTIONAL { ?id crm:P3_has_note ?note . }
                VALUES ?unit  { {0} }
				}
        */});
        
        this.getById = function(id) {
            var qry = personQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
            	console.log(data);
                if (data.length) {
                    return personMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Does not exist");
            });
        };

		this.getSuperunit = function(unit) {
            var qry = relatedUnitQry.format("<{0}>".format(unit));
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return unitMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Does not exist");
            });
        };
});

