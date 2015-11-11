'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('unitService', function($q, SparqlService, unitMapperService,
                Unit, eventService, casualtyService) {
        
        var unitService = this;
			
			
        Unit.prototype.fetchRelatedEvents = function() {
            var self = this;
            return eventService.getEventsByActor(self.id).then(function(events) {
                self.relatedEvents = events;
            });
        };
        
        Unit.prototype.fetchRelated = function() {
            var self = this;
            return self.fetchRelatedEvents().then(
            	function() { return self.fetchUnitEvents(); }).then(
            	function() { return self.fetchRelatedUnits(); }).then(
            	function() { return self.fetchRelatedPersons(); }).then(
            	function() {
                if (self.relatedEvents || self.relatedUnits || self.relatedPersons ) {
                    self.hasLinks = true;
                }
            });
        };
			
		 Unit.prototype.fetchRelated2 = function() {
            var self = this;
            return self.fetchRelatedEvents().then(
            	// function() { return self.fetchSubUnits(); }).then(
            	function() { return self.fetchUnitEvents(); }).then(
            	function() { return self.fetchRelatedPersons(); }).then(
            	function() {
                if (self.relatedEvents || self.relatedPersons ) {
                    self.hasLinks = true;
                }
            });
        };
        
		  Unit.prototype.fetchRelatedUnits = function() {
		  		var self = this;
            return unitService.getRelatedUnit(self.id).then(function(units) {
            	self.relatedUnits=[];
            	for (var i=0; i<units.length; i++) {
            		var unit=units[i];
						if ('id' in unit) { 
							if ('name' in unit && _.isArray(unit.name)) {
								unit.name=unit.name[0];
							}
							self.relatedUnits.push(unit);
							}
            	}
            });
        };
        
        Unit.prototype.fetchSubUnits = function() {
		  		var self = this;
            return unitService.getSubUnits(self.id).then(function(units) {
            	self.subUnits=[];
            	for (var i=0; i<units.length; i++) {
            		var unit=units[i];
						if ('id' in unit) { 
							self.subUnits.push(unit);
						}
            	}
            	// console.log("self.subUnits: "+self.subUnits.length); console.log(self.subUnits);
            });
        };
        
        Unit.prototype.fetchUnitEvents = function() {
		  		var self = this;
            return unitService.getUnitEvents(self.id).then(function(events) {
            	self.processUnitEvents(events);
            });
        };
        
        Unit.prototype.fetchRelatedPersons = function() {
		  		var self = this;
            return unitService.getPersons(self.id).then(function(persons) {
            	var 	em=new EventMapper(),
            			arr = [], arr2=[];
            	for (var i=0; i<persons.length; i++) {
            		var p=persons[i];
            		if ('name' in p) {
            			if (_.isArray(p.name)) {p.name = p.name[0];}
            			if ('rank' in p && p.name.indexOf(' ')<0) {p.name = p.rank +' '+ p.name;}
            			arr.push(p);
	            		if ('role' in p) { 
	            			var pname =p.role+' '+p.name; 
	            			if ('start_time' in p) {
	            				var edate=p.start_time;
	            				var edate2= ('end_time' in p) ? p.end_time : edate;
									edate=em.getExtremeDate(edate, true);
									edate2=em.getExtremeDate(edate2, false);
									edate=em.formatDateRange(edate,edate2);
	            				arr2.push(pname + ', '+edate);
	            			} else { arr2.push(pname); }
	            		}
	            		
	            	}
            	}
            	
            	if (arr.length) {self.relatedPersons = arr;}
            	if (arr2.length) {self.commanders = arr2;}
            });
        };
        
        Unit.prototype.fetchCasualties = function() {
            var self = this;
            // console.log("fetchCasualties");
            return casualtyService.getCasualtyLocationsByTimeAndUnit("1939-09-09","1940-03-30",self.id)
                .then(function(participants) {
                	console.log("participants :"+participants.length);
                	// console.log(participants);
                    self.relatedCasualties = participants;
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

        var unitQry = prefixes +
          '  SELECT DISTINCT ?id ?name ?abbrev ?note WHERE {  ' +
          '      ?ename a etypes:UnitNaming . ' +
          '      ?ename skos:prefLabel ?name . ' +
          '      OPTIONAL {?ename skos:altLabel ?abbrev . } ' +
          '      ?ename crm:P95_has_formed ?id . ' +
          '      OPTIONAL {?id crm:P3_has_note ?note . } ' +
          '      VALUES ?id  { {0} } ' +
          '  } ';
        
        var unitEventQry = prefixes +
      '  SELECT * WHERE { ' +
	  '  		  VALUES ?unit  { {0} } ' +
	  '  		  { ' +
	  '  		    ?id a crm:E66_Formation ; ' +
	  '  		    	crm:P95_has_formed ?unit . ' +
	  '  		  } UNION { ' +
	  '  		    ?id a etypes:UnitNaming ; ' +
	  '  		      	crm:P95_has_formed ?unit . ' +
	  '  		  } UNION { ' +
	  '  		   	?id a etypes:TroopMovement ; ' +
	  '  		    	crm:P95_has_formed ?unit . ' +
	  '  		  } UNION { ' +
	  '  		    ?id a etypes:Battle ; ' +
	  '  		    	crm:P11_had_participant ?unit . ' +
	  '  		  } ' +
	  '  		  ?id a ?idclass . ' +
	  '  			OPTIONAL { ?id skos:prefLabel ?name . } ' +
	  '  		    OPTIONAL { ?id skos:altLabel ?abbrev . } ' +
	  '  		  OPTIONAL { ' +
	  '  		    ?id crm:P4_has_time-span ?time .  ' +
	  '  		    ?time crm:P82a_begin_of_the_begin ?start_time ;  ' +
	  '  		          crm:P82b_end_of_the_end ?end_time .  ' +
	  '  		  } ' +
	  '  		  OPTIONAL {  ' +
	  '  		    ?id crm:P7_took_place_at ?place_id . ' +
	  '  		    OPTIONAL { ' +
	  '  		      ?place_id skos:prefLabel ?place_label . ' +
	  '  		    } ' +
	  '  		  } ' +
	  '  		} ORDER BY ?start_time ?end_time ';

        var relatedUnitQry = prefixes +
         '   SELECT ?id ?name ?abbrev WHERE {  ' +
		 '   		  { SELECT ?id ?name  WHERE { ' +
		 '   		                  ?ejoin a etypes:UnitJoining ; ' +
		 '   		                    crm:P143_joined ?unit ; ' +
		 '   		                    crm:P144_joined_with ?id . ' +
		 '   		                ?ename a etypes:UnitNaming ; ' +
		 '   		                     skos:prefLabel ?name ; ' +
		 '   		                     crm:P95_has_formed ?id . ' +
		 '   		      			OPTIONAL { ?ename skos:altLabel ?abbrev . } ' +
		 '   		                VALUES ?unit  { {0} } ' +
		 '   		  	} GROUP BY ?id ?name  LIMIT 2  ' +
		 '   		 } UNION { ' +
		 '   			SELECT ?id ?name  (COUNT(?s) AS ?no) WHERE { ' +
		 '   							{?ejoin a etypes:UnitJoining ; ' +
		 '   					                    crm:P143_joined ?id ; ' +
		 '   					                    crm:P144_joined_with ?unit . ' +
		 '   					      } UNION { ?ejoin a etypes:UnitJoining ; ' +
		 '   					                    crm:P143_joined ?unit ; ' +
		 '   					                    crm:P144_joined_with ?superunit . ' +
		 '   					                 ?ejoin2 a etypes:UnitJoining ; ' +
		 '   					                    crm:P143_joined ?id ; ' +
		 '   					                    crm:P144_joined_with ?superunit .    ' +
		 '   					        FILTER ( ?unit != ?id ) ' +
		 '   					      } ' +
		 '   		                ?s ?p ?id . ' +
		 '   		                ?ename a etypes:UnitNaming ; ' +
		 '   		                     skos:prefLabel ?name ; ' +
		 '   		                     crm:P95_has_formed ?id . ' +
		 '   		                OPTIONAL {?ename skos:altLabel ?abbrev . } ' +
		 '   		                VALUES ?unit  { {0} } ' +
		 '   		    } GROUP BY ?id ?name ?no ORDER BY DESC(?no) LIMIT 5 } ' +
		 '   		} ';
        
        var subUnitQryOLD = prefixes +
			'SELECT DISTINCT ?id (GROUP_CONCAT(?name; separator = "; ") AS ?names)' +
			'    WHERE { ' +
			'    VALUES ?unit { {0} } ' +
			'' +
			' { 	?evt a etypes:UnitJoining .' +
			'	?evt crm:P143_joined ?id .' +
			'   	?evt crm:P144_joined_with ?unit .' +
			'  } UNION {' +
			'    ?evt a etypes:UnitJoining .' +
			'	?evt crm:P143_joined ?id2 .' +
			'   	?evt crm:P144_joined_with ?unit .' +
			'    ?evt2 a etypes:UnitJoining .' +
			'	?evt2 crm:P143_joined ?id .' +
			'   	?evt2 crm:P144_joined_with ?id2 .' +
			'  }' +
			'	?id a atypes:MilitaryUnit .' +
			'	?id skos:prefLabel ?name .' +
			'} GROUP BY ?id ';

		var subUnitQry = prefixes +
			'SELECT DISTINCT ?id	'+
    		'WHERE { 	'+
    		'	VALUES ?unit { {0} } 	'+
  			'	?unit (^crm:P144_joined_with/crm:P143_joined)+ ?id .	'+
    		'	?id a atypes:MilitaryUnit .	'+
			'} GROUP BY ?id ';

        var relatedPersonQry = prefixes +
	   ' 	SELECT DISTINCT ?id ?name ?role ?start_time ?end_time ?rank (COUNT(?s) AS ?no) WHERE { ' +
	   ' 	  VALUES ?unit { {0} } . ' +
	   ' 	    { ?evt a etypes:PersonJoining ; ' +
	   ' 	    crm:P143_joined ?id . ' +
	   ' 	    OPTIONAL { ?evt crm:P107_1_kind_of_member ?role . } ' +
	   ' 	    ?evt  crm:P144_joined_with ?unit .  ' +
	   ' 	    OPTIONAL { ' +
	   ' 	    	?evt crm:P4_has_time-span ?time .  ' +
	   ' 	    	?time crm:P82a_begin_of_the_begin ?start_time ;  ' +
	   ' 	          crm:P82b_end_of_the_end ?end_time .  ' +
	   ' 	  	} ' +
	   ' 	  } UNION {  ' +
	   ' 	    ?id owl:sameAs ?mennytmies . ' +
	   ' 	    ?mennytmies a foaf:Person . ' +
	   ' 	    ?mennytmies casualties:osasto ?unit . ' +
	   ' 	  } ' +
	   ' 	  OPTIONAL { ?s ?p ?id . } ' +
	   ' 	    ?id skos:prefLabel ?name . ' +
	   ' 	    OPTIONAL { ?id :hasRank ?ranktype . ?ranktype skos:prefLabel ?rank . } ' +
	   ' 	  } GROUP BY ?id ?name ?role ?no ?rank ?start_time ?end_time  ' +
	   ' 		ORDER BY DESC(?no) LIMIT 8 ';
			
			
		var selectorQuery  = prefixes +
			'SELECT DISTINCT ?name ?id WHERE {        '+
			'  ?ename a etypes:UnitNaming .      ?ename skos:prefLabel ?name .       '+
			'  ?ename crm:P95_has_formed ?id .       '+
			'  FILTER (regex(?name, "^.*{0}.*$", "i"))    '+
			'}  ORDER BY lcase(?name)  	 '+
			'LIMIT 1000  ';
			
		var selectorQueryOLD  = prefixes +
			'SELECT DISTINCT ?name ?id WHERE {        '+
			'  ?ename a etypes:UnitNaming .      ?ename skos:prefLabel ?name .       '+
			'  ?ename crm:P95_has_formed ?id .       '+
			'  { ?evt a crm:E66_Formation . ?evt crm:P95_has_formed ?id . }       '+
			'  UNION       '+
			'  { ?evt a etypes:Battle . ?evt crm:P11_had_participant ?id . }       '+
			'  UNION        '+
			'  { ?evt a etypes:TroopMovement . ?evt crm:P95_has_formed ?id . }       '+
			'  ?evt crm:P7_took_place_at ?place_id .       '+
			'  ?place_id geo:lat ?lat .       '+
			'  FILTER (regex(?name, "^.*{0}.*$", "i"))    '+
			'}  ORDER BY lcase(?name)  	 '+
			'LIMIT 1000  ';
		 
		var actorInfoQry = prefixes +
        ' SELECT ?id ?type ?label ?familyName ?firstName ' +
        ' FROM <http://ldf.fi/warsa/actors> ' +
        ' FROM <http://ldf.fi/warsa/actors/actor_types> ' +
        ' FROM NAMED <http://ldf.fi/warsa/events> ' +
        ' WHERE { ' +
        '   VALUES ?id { {0} } ' +
        '   ?id ' +
        '       a ?type ; ' +
        '       skos:prefLabel ?label . ' +
        '   OPTIONAL { ?id ' +
        '       foaf:familyName ?familyName ; ' +
        '       foaf:firstName ?firstName . ' +
        '   } ' +
        ' } ';
        
		this.getById = function(id) {
            var qry = unitQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
            	 if (data.length) {
                    return unitMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Does not exist");
            });
        };

		this.getUnitEvents = function(id) {
				var qry = unitEventQry.format("<{0}>".format(id));
				return endpoint.getObjects(qry).then(function(data) {
            	return unitMapperService.makeObjectListNoGrouping(data);
            });
        };
        
		this.getRelatedUnit = function(unit) {
            var qry = relatedUnitQry.format("<{0}>".format(unit));
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectList(data);
            });
        };
        
        this.getSubUnits = function(unit) {
            var qry = subUnitQry.format("<{0}>".format(unit));
            // console.log(qry);
            return endpoint.getObjects(qry).then(function(data) {
            	 return unitMapperService.makeObjectList(data);
            });
        };
        
		this.getPersons = function(unit) {
            var qry = relatedPersonQry.format("<{0}>".format(unit));
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectList(data);
            });
        };
        
        this.getItems = function (regx, controller) {
            var qry = selectorQuery.format("{0}".format(regx));
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectListNoGrouping(data);
            });
        };
        
        this.getActorInfo = function(ids) {
            var qry;
            if (_.isArray(ids)) {
                ids = "<{0}>".format(ids.join("> <"));
            } else if (ids) {
                ids = "<{0}>".format(ids);
            } else {
                return $q.when(null);
            }
            qry = actorInfoQry.format(ids);
            return endpoint.getObjects(qry).then(function(data) {
                return unitMapperService.makeObjectList(data);
            });
        };
});

