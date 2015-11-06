'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('personService', function($q, SparqlService, personMapperService,
                Person, eventService) {
        
        var personService = this;

        Person.prototype.fetchLifeEvents = function() {
            var self = this;
            return personService.getLifeEvents(self.id).then(function(events) {
            	self.processLifeEvents(events);
            });
        };
        
        Person.prototype.fetchRelatedEvents = function() {
            var self = this;
            return personService.getRelatedEvents(self.id).then(function(events) {
            	//console.log(events);
            	self.processRelatedEvents(events);
            });
        };
        
        Person.prototype.fetchRelated = function() {
            var self = this;
            return self.fetchLifeEvents().then(
            	function() { return self.fetchRelatedUnits(); }).then(
               function() { return self.fetchRelatedEvents(); }).then(
               function() { return self.fetchNationalBib(); }).then(
               function() {  if (self.battles || self.events || self.units ) {
                    self.hasLinks = true;
                }
            });
        };
		
		  Person.prototype.fetchRelatedUnits = function() {
		  		var self = this;
            return personService.getRelatedUnits(self.id).then(function(units) {
            	if (units.length) self.units = units;
            });
        };
      
      	Person.prototype.fetchNationalBib = function() {
      		var self = this;
            return personService.getNationalBibliography(self.sname,self.fname).then(function(nb) {
            	//console.log('got NationalBib.');
            	//console.log(nb);
            	if (nb.length) self.nationals = nb;
            });
      	}  
      	
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
        ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
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
				SELECT DISTINCT ?id ?sname ?fname ?note ?rank WHERE { 
					  VALUES ?id { {0} }
					  ?id foaf:familyName ?sname .
					  OPTIONAL { ?id foaf:firstName ?fname . }
					  OPTIONAL { ?id crm:P3_has_note ?note . }
					  OPTIONAL { ?id :hasRank ?ranktype . ?ranktype skos:prefLabel ?rank . }
				} 
  		 */});
  		 
        var personLifeEventsQry = prefixes + hereDoc(function() {/*!
				SELECT DISTINCT ?id  ?idclass ?start_time ?end_time ?rank  WHERE { 
		    
  		 VALUES ?person { {0} }
			{ ?id a crm:E67_Birth ; crm:P98_brought_into_life ?person . }
		  	 UNION 
            { ?id a crm:E69_Death ; crm:P100_was_death_of ?person . }
          UNION 
            { ?id a etypes:Promotion ; crm:P11_had_participant ?person . 
            OPTIONAL { ?id :hasRank ?ranktype . ?ranktype skos:prefLabel ?rank . }
            }
  
            ?id a ?idclass .
            ?id crm:P4_has_time-span ?time . 
            ?time crm:P82a_begin_of_the_begin ?start_time .
            ?time crm:P82b_end_of_the_end ?end_time .
          
		} ORDER BY ?start_time
        */});
        
        var relatedEventQry = prefixes + hereDoc(function() {/*!
        SELECT DISTINCT ?id ?idclass ?description ?unit ?role ?link ?start_time WHERE { 
    		  VALUES ?person { {0} } . # { :person_7 } # 
			    
			    { ?id a etypes:Battle ; 
			      	crm:P11_had_participant ?person ; 
			      	events:hadUnit ?unit ; 
			      	skos:prefLabel ?description . }
			    UNION
			    { ?id crm:P11_had_participant ?person ; 
			    	skos:prefLabel ?description . }
			    UNION 
			    { ?id a etypes:PersonJoining . ?id crm:P143_joined ?person .
			      {
			      ?id crm:P107_1_kind_of_member ?role . 
			      ?id crm:P144_joined_with ?unit. 
			      ?unit skos:prefLabel ?description . 
			      }
			    } 
			    UNION
			    {
               ?id a <http://ldf.fi/warsa/articles/article/Article> ;
               dcterms:hasFormat ?link ;
               <http://purl.org/dc/elements/1.1/title> ?description ;
               dcterms:subject ?person .
             }
			    
			   ?id a ?idclass .
			  	 
			    OPTIONAL {
			      ?id crm:P4_has_time-span ?time . 
			      ?time crm:P82a_begin_of_the_begin ?start_time ; 
			      		crm:P82b_end_of_the_end ?end_time . 
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
       
       var relatedUnitQry = prefixes + hereDoc(function() {/*!
			   SELECT DISTINCT ?id ?description ?role WHERE {
				VALUES ?person { {0} } . # { :person_7 } # 
			    { ?evt a etypes:PersonJoining ;
			          crm:P143_joined ?person .
                OPTIONAL { ?evt crm:P107_1_kind_of_member ?role . }
			          ?evt  crm:P144_joined_with ?id . 
			     } UNION { 
			          ?person owl:sameAs ?mennytmies .
			          ?mennytmies a foaf:Person .
			          ?mennytmies casualties:osasto ?id . 
			    }
			    OPTIONAL { ?id skos:prefLabel ?description . }
			} 
			*/});
		
		// new SparqlService("http://ldf.fi/history/sparql");
		var nationalBibliographyQry = hereDoc(function() {/*!
					PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
					PREFIX kb: <http://ldf.fi/history/kb>
					PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
					
					SELECT  ?id ?label WHERE {
					  ?id a crm:E21_Person .
					  ?id rdfs:label ?label .
					  FILTER (regex(?label, "{0}", "i"))
					}
			*/});
		
		this.getById = function(id) {
            var qry = personQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                	  return personMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Does not exist");
            });
        };
        
		this.getRelatedUnits = function(id) {
				var qry = relatedUnitQry.format("<{0}>".format(id));
				return endpoint.getObjects(qry).then(function(data) {
            	return personMapperService.makeObjectListNoGrouping(data);
            });
        };
        
		this.getRelatedEvents = function(id) {
				var qry = relatedEventQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
            	return personMapperService.makeObjectList(data);
            });
        };
        
		this.getLifeEvents = function(id) {
				var qry = personLifeEventsQry.format("<{0}>".format(id));
				return endpoint.getObjects(qry).then(function(data) {
            	return personMapperService.makeObjectListNoGrouping(data);
            });
        };
        
      this.getNationalBibliography = function(sukunimi,etunimi) {
      		console.log(etunimi);
      		var rgx ="XZYZ-FHWEJ";
      		if (etunimi) {
      			var etu1 = (etunimi === 'Carl Gustaf Emil') ? etunimi :etunimi.split(' ')[0];
	      		// ^.*Talvela,.*Paavo.*[(].*[)]$
	      		var rgx = "^.*"+sukunimi+",.*"+etu1+".*[(].*[)]$"; 
					var qry = nationalBibliographyQry.format("{0}".format());
				}
				var qry = nationalBibliographyQry.format("{0}".format(rgx));
				console.log(qry);
				var end2 = new SparqlService("http://ldf.fi/history/sparql");
            return end2.getObjects(qry).then(function(data) {
            	return personMapperService.makeObjectList(data);
            });
        };
});

