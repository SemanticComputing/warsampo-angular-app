'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('rankService', function($q, SparqlService, rankMapperService,
                Rank) {
        
        var rankService = this;
				
        Rank.prototype.fetchRelatedPersons = function() {
            var self = this;
            return rankService.getRelatedPersons(self.id).then(function(persons) {
            	self.isLoadingPersons=false;
            	if (persons.length) {
            		for (var i=0; i<persons.length; i++) {
            			var pers=persons[i];
            			pers.label = ('fname' in pers) ? pers.fname +' '+pers.sname : pers.sname;
            		}
            		self.persons = persons;
            	}
            });
        };
        
        //	for info page:
        Rank.prototype.fetchRelated = function() {
            var self = this;
            return self.fetchRelatedPersons().then(
               function() {  if (self.persons ) {
                    self.hasLinks = true;
                }
            });
        };
			
      
        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var prefixes = '' +
        ' PREFIX : <http://ldf.fi/warsa/actors/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX dcterms: <http://purl.org/dc/terms/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' + 
        ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX etypes: <http://ldf.fi/warsa/events/event_types/> ';
        
		var rankQry = prefixes +
		   ' 	SELECT DISTINCT ?id ?label ?abbrev ?comment WHERE {  ' +
		   '         VALUES ?id { {0} } .   ' +
		   ' 	    ?id a <http://ldf.fi/warsa/actors/ranks/Rank> . ' +
		   ' 	    ?id skos:prefLabel ?label . ' +
		   ' 	    OPTIONAL { ?id <http://www.w3.org/2000/01/rdf-schema#comment> ?comment . } ' +
		   ' 	    OPTIONAL { ?id skos:altLabel ?abbrev . } ' +
		   ' 	}    ';
  		 
        var rankPersonQry = prefixes +
		   ' 	SELECT DISTINCT ?id ?sname ?fname WHERE { ' +
		   '      VALUES ?rank { {0} } .' +
		   ' 	    ?id a atypes:MilitaryPerson .' +
		   '      { ?id :hasRank ?rank . } ' +
		   '         UNION {' +
		   '       ?evt a etypes:Promotion .' +
		   '       ?evt :hasRank ?rank .' +
		   '       ?evt crm:P11_had_participant ?id .' +
		   '       } ' +
		   '     ?id foaf:familyName ?sname . ' +
		   ' 		?id foaf:firstName ?fname .  ' +
		   ' 	}  LIMIT 20 ';
        
        
		this.getById = function(id) {
            var qry = rankQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
            	if (data.length) {
                	return rankMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Does not exist");
            });
        };
        
		this.getRelatedPersons = function(id) {
				var qry = rankPersonQry.format("<{0}>".format(id));
				// console.log(qry);
				return endpoint.getObjects(qry).then(function(data) {
					return rankMapperService.makeObjectListNoGrouping(data);
            });
        };
        
		
    		
        
});

