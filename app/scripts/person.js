'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('personService', function($q, SparqlService, personMapperService,
                Person) {

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
                self.processRelatedEvents(events);
            });
        };

        // for info page:
        Person.prototype.fetchRelated = function() {
            var self = this;
            return self.fetchLifeEvents()
                .then(function() { return self.fetchRelatedUnits(); })
                .then(function() { return self.fetchRelatedEvents(); })
                .then(function() { return self.fetchNationalBib(); })
                .then(function() {
                    if (self.battles || self.events || self.units || self.nationals || self.ranks ) {
                        self.hasLinks = true;
                    }
                });
        };

        // for demo page:
        Person.prototype.fetchRelated2 = function() {
            var self = this;

            return self.fetchLifeEvents()
                .then(function() { return self.fetchRelatedUnits(); })
                .then(function() { return self.fetchRelatedEvents(); })
                .then(function() { return self.fetchNationalBib(); })
                .then(function() { return self.fetchRelatedPhotos(); })
                .then(function() {
                    if (self.battles || self.events || self.units || self.nationals || self.images || self.articles ) {
                        self.hasLinks = true;
                    }
                });
        };

        Person.prototype.fetchRelatedUnits = function() {
            var self = this;
            return personService.getRelatedUnits(self.id).then(function(units) {
                if (units.length && units[0].id) {
                    for (var i=0; i<units.length; i++) {
                        var unit=units[i];
                        if ('label' in unit) {
                            unit.label = unit.label.split(';')[0];
                        }
                    }
                    self.units = units;
                }
            });
        };

        Person.prototype.fetchRelatedPhotos = function() {
            var self = this;
            return personService.getRelatedPhotos(self.id).then(function(imgs) {
                if (imgs.length) {
                    imgs.forEach(function(img) {
                        img.thumbnail = img.url.replace("_r500", "_r100");
                    });
                    self.images = imgs;
                }
            });
        };

        Person.prototype.fetchNationalBib = function() {
            var self = this;
            return personService.getNationalBibliography(self.sname,self.fname).then(function(nb) {
                if (nb.length && ('id' in nb[0])) { 
                	self.nationals = nb[0]; 
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

        var personQry = prefixes +
        ' SELECT DISTINCT ?id ?label ?sname ?fname ?note ?rank ?rankid ?birth_time ?death_time '+
        '       ?casualty ?birth_place ?birth_place_uri ?death_place ?death_place_uri ?bury_place ?bury_place_uri '+
        '       ?living_place ?living_place_uri ?profession ?mstatus ?num_children ?way_to_die ?cas_unit '+
        '       ?sid ?source ' +
        ' WHERE { ' +
        '   VALUES ?id { {0} }' +
        '   ?id foaf:familyName ?sname .' +
        '   ?id skos:prefLabel ?label .' +
        '   OPTIONAL { ?id foaf:firstName ?fname . }' +
        '   OPTIONAL { ?id crm:P3_has_note ?note . }' +
        '   OPTIONAL { ?id <http://purl.org/dc/elements/1.1/source> ?sid . ' +
        '     OPTIONAL { ?sid skos:prefLabel ?source . } ' +
        '   }' +
        '   OPTIONAL { ?id :hasRank ?rankid . ?rankid skos:prefLabel ?rank . }' +
        '   OPTIONAL { ' +
        '     ?id owl:sameAs ?casualty .' +
        '     ?casualty a foaf:Person .'  +
        '     OPTIONAL { ?casualty casualties:syntymaeaika ?birth_time . }' +
        '     OPTIONAL { ' +
        '       ?casualty casualties:synnyinkunta ?birth_place_uri . ' +
        '       ?birth_place_uri skos:prefLabel ?birth_place . ' +
        '     } ' +
        '     OPTIONAL { ?casualty casualties:kuolinaika ?death_time . } ' +
        '     OPTIONAL { ' +
        '         ?casualty casualties:kuolinkunta ?death_place_uri . '+
        '         ?death_place_uri skos:prefLabel ?death_place . ' +
        '     }' +
        '     OPTIONAL { ' +
        '         ?casualty casualties:hautauskunta ?bury_place_uri . ' +
        '         ?bury_place_uri skos:prefLabel ?bury_place . ' +
        '     } ' +
        '     OPTIONAL { ' +
        '         ?casualty casualties:asuinkunta ?living_place_uri . '+
        '         ?living_place_uri skos:prefLabel ?living_place . }' +
        '     OPTIONAL { ?casualty casualties:ammatti ?profession . }' +
        '     OPTIONAL {  ' +
        '         ?casualty casualties:siviilisaeaety ?mstatus_uri . ' +
        '         ?mstatus_uri skos:prefLabel ?mstatus . ' +
        '     }' +
        '     OPTIONAL { ?casualty casualties:ammatti ?profession . }' +
        '     OPTIONAL { ?casualty casualties:joukko_osasto ?cas_unit . }' +
        '     OPTIONAL { ?casualty casualties:lasten_lukumaeaerae ?num_children . } '+
        '     OPTIONAL { ' +
        '         ?casualty casualties:menehtymisluokka ?way_id . ' +
        '         ?way_id skos:prefLabel ?way_to_die . ' +
        '     } '+
        '   }' +
        ' } ';

        var personLifeEventsQry = prefixes +
        ' SELECT DISTINCT ?id  ?idclass ?start_time ?end_time ?rank ?rankid WHERE { ' +
  	   '  VALUES ?person { {0} } ' +
	   ' 	{ ?id a crm:E67_Birth ; crm:P98_brought_into_life ?person . } ' +
	   '   	 UNION  ' +
       '     { ?id a crm:E69_Death ; crm:P100_was_death_of ?person . } ' +
       '   UNION  ' +
       '     { ?id a etypes:Promotion ; crm:P11_had_participant ?person .  ' +
       '     OPTIONAL { ?id :hasRank ?rankid . ?rankid skos:prefLabel ?rank . } ' +
       '     } ' +
       '     ?id a ?idclass . ' +
       '     ?id crm:P4_has_time-span ?time .  ' +
       '     ?time crm:P82a_begin_of_the_begin ?start_time . ' +
       '     ?time crm:P82b_end_of_the_end ?end_time . ' +
	   ' } ORDER BY ?start_time  ';

        var relatedEventQry = prefixes +
       ' SELECT DISTINCT ?id ?idclass ?description (?description AS ?label) ?unit ?role ?link ?start_time WHERE { ' +
       ' 	  VALUES ?person { {0} } . ' +
	   ' 	    { ?id a etypes:Battle ; ' +
	   ' 	      	crm:P11_had_participant ?person ; ' +
	   ' 	      	events:hadUnit ?unit ; ' +
	   ' 	      	skos:prefLabel ?description . }' +
	   ' 	    UNION ' +
	   ' 	    { ?id crm:P11_had_participant ?person ;  ' +
	   ' 	    	skos:prefLabel ?description . } ' +
	   ' 	    UNION  ' +
	   ' 	    { ?id a etypes:PersonJoining . ?id crm:P143_joined ?person . ' +
	   ' 	      { ' +
	   ' 	      ?id crm:P107_1_kind_of_member ?role .  ' +
	   ' 	      ?id crm:P144_joined_with ?unit . ' +
	   ' 	      ?unit skos:prefLabel ?description . '+
	   ' 	      } '+
	   ' 	    }  '+
	   ' 	    UNION '+
	   ' 	    { '+
       '        ?id a <http://ldf.fi/warsa/articles/article/Article> ; '+
       '        dcterms:hasFormat ?link ; '+
       '        <http://purl.org/dc/elements/1.1/title> ?description ; '+
       '        { ?id dcterms:subject ?person . }  '+
       '        UNION  '+
       '        { ?author skos:relatedMatch ?person . ?id <http://ldf.fi/warsa/articles/article/author> ?author . } '+
       '      } ' +
	   ' 	   ?id a ?idclass . ' +
	   ' 	    OPTIONAL { ' +
	   ' 	      ?id crm:P4_has_time-span ?time .  ' +
	   ' 	      ?time crm:P82a_begin_of_the_begin ?start_time ;  ' +
	   ' 	      		crm:P82b_end_of_the_end ?end_time .  ' +
	   ' 	    } ' +
	   ' 	    OPTIONAL { ' +
	   ' 	      ?id crm:P7_took_place_at ?place_id . ' +
	   ' 	      OPTIONAL { ' +
	   ' 	        ?place_id skos:prefLabel ?place_label .  ' +
	   ' 	        ?place_id geo:lat ?lat ;  geo:long ?lon .  ' +
	   ' 	      } ' +
	   ' 	    } ' +
	   ' 	} ORDER BY ?start_time ?end_time ';

       var relatedUnitQry = prefixes +
		   '   SELECT DISTINCT ?id (GROUP_CONCAT(?name; separator = "; ") AS ?label) WHERE { 	' +
		   '   VALUES ?person { {0} } . ' +
		   '     { ?evt a etypes:PersonJoining ; ' +
		   '           crm:P143_joined ?person . ' +
		   '           ?evt  crm:P144_joined_with ?id .  ' +
		   '      } UNION {  ' +
		   '           ?person owl:sameAs ?mennytmies . ' +
		   '           ?mennytmies a foaf:Person . ' +
		   '           ?mennytmies casualties:osasto ?id .  ' +
		   '     } ' +
		   '    ?id skos:prefLabel ?name . ' +
		   '   } GROUP BY ?id ?label ';

		var nationalBibliographyQry = 
        '	PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>  	' +
	   '	PREFIX kb: <http://ldf.fi/history/kb>  	' +
	   '	PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>  	' +
	   '	PREFIX owl: <http://www.w3.org/2002/07/owl#>' +
	   '	PREFIX dc: <http://purl.org/dc/elements/1.1/>' +
	   '	PREFIX dct: <http://purl.org/dc/terms/>' +
	   '	PREFIX schema: <http://schema.org/>' +
	   ' ' +
	   '	SELECT  ?id ?comment ?type ?image ?bdate ?ddate ?id2 ?label '+
	   '	(SAMPLE(?placeOfBirth1) AS ?placeOfBirth) '+
	   '	(SAMPLE(?placeOfDeath1) AS ?placeOfDeath) '+
	   ' 	WHERE {' +
	   '	  ?id2 a crm:E21_Person .' +
	   '	  ?id2 rdfs:label ?label .' +
	   ' 	  FILTER (regex(?label, "{0}", "i")) ' +
	   '	  ?id a crm:E21_Person .' +
	   '	  ?id owl:sameAs ?id2 .' +
	   '	  ?id rdfs:comment ?comment .' +
	   '' +
	   '	  ?id dct:type ?type .' +
	   '	  OPTIONAL { ?id schema:birthDate ?bdate . } ' +
	   '	  OPTIONAL { ?id schema:deathDate ?ddate . } ' +
	   '	  OPTIONAL {?birth crm:P98_brought_into_life ?id . ' +
	   '                ?birth crm:P7_took_place_at ?place .' +
	   '                ?place rdfs:label ?placeOfBirth1 . } ' +
	   '	  OPTIONAL { ?death crm:P100_was_death_of ?id . ' +
	   '                ?death crm:P7_took_place_at ?placeD .' +
	   '                ?placeD rdfs:label ?placeOfDeath1 . } ' +
	   '	  OPTIONAL { ?id schema:image ?image . } ' +
	   '	} GROUP BY ?id ?comment ?type ?image ?bdate ?ddate ?id2 ?label ?placeOfBirth ?placeOfDeath ';
	   
		//	Query for searching people with matching names: 'La' -> 'Laine','Laaksonen' etc
		var selectorQuery = prefixes +
				'SELECT DISTINCT ?name ?id WHERE {	' +
		'  SELECT DISTINCT ?name ?id WHERE {	' +
		'    GRAPH <http://ldf.fi/warsa/actors> {	' +
		'      ?id a atypes:MilitaryPerson .   	    	' +
		'      ?id skos:prefLabel ?name .   	    	' +
		'      FILTER (regex(?name, "^{0}$", "i"))	' +
		'    } 	' +
		'  } LIMIT 300 	' +
		'} ORDER BY ?name 	';

		var photoQuery = prefixes +
        ' SELECT * WHERE {  ' +
        ' 	VALUES ?person { {0} } . ' +
        ' 	?id a <http://purl.org/dc/dcmitype/Image> . ' +
        ' 	?id dcterms:subject ?person .  ' +
        ' 	?id dcterms:created ?created . ' +
        ' 	?id dcterms:description ?description . ' +
        ' 	?id <http://schema.org/contentUrl> ?url . } LIMIT 150 ';

        var byUnitQry = prefixes +
        'SELECT ?id ?name (?name AS ?label) ?rank (COUNT(?s) AS ?no) WHERE { ' +
        ' 	{ SELECT ?id WHERE ' +
        ' 	    { ?evt a etypes:PersonJoining ; ' +
        ' 	    crm:P143_joined ?id . ' +
        ' 	    ?evt  crm:P144_joined_with {0} .  ' +
        '    	} LIMIT 200' +
        '	} UNION ' +
        '    { SELECT ?id WHERE {' +
        ' 	    ?id owl:sameAs ?mennytmies . ' +
        ' 	    ?mennytmies a foaf:Person . ' +
        ' 	    ?mennytmies casualties:osasto {0} . ' +
        '    	} LIMIT 200 ' +
        ' 	} ' +
        '    OPTIONAL { ?s ?p ?id . } ' +
        '    ?id skos:prefLabel ?name . ' +
        '    OPTIONAL { ?id :hasRank ?ranktype . ?ranktype skos:prefLabel ?rank . } ' +
        '} GROUP BY ?id ?name ?label ?no ?rank   ' +
        ' 		ORDER BY DESC(?no) LIMIT 100 ';

        var casualtiesByTimeSpanQry = prefixes +
        ' SELECT DISTINCT ?id ?label ?death_time ?casualty ' +
        ' WHERE { ' +
        '   ?id skos:prefLabel ?label . ' +
        '   ?id owl:sameAs ?casualty . ' +
        '   ?casualty a foaf:Person . ' +
        '   ?casualty casualties:kuolinaika ?death_time . ' +
        '   FILTER(?death_time >= "{0}"^^xsd:date && ?death_time <= "{1}"^^xsd:date) ' +
        ' } ';

        this.getByUnit = function(id) {
            var qry = byUnitQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    return personMapperService.makeObjectList(data);
                }
                return $q.when();
            });
        };

        this.getById = function(id) {
            var qry = personQry.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
                if (data.length) {
                    // because of temporary multiple labels in casualties data set:
                    return personMapperService.makeObjectList(data)[0];
                }
                return $q.reject("Does not exist");
            });
        };

        this.getByIdList = function(ids) {
            var qry;
            if (_.isArray(ids)) {
                ids = "<{0}>".format(ids.join("> <"));
            } else if (ids) {
                ids = "<{0}>".format(ids);
            } else {
                return $q.when();
            }
            qry = personQry.format(ids);
            return endpoint.getObjects(qry).then(function(data) {
                return personMapperService.makeObjectList(data);
            });
        };

        this.getCasualtiesByTimeSpan = function(start, end) {
            return endpoint.getObjects(casualtiesByTimeSpanQry.format(start, end))
                .then(function(data) {
                    if (data.length) {
                        return personMapperService.makeObjectList(data);
                    }
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

        this.getRelatedPhotos = function(id) {
            var qry = photoQuery.format("<{0}>".format(id));
            return endpoint.getObjects(qry).then(function(data) {
                return personMapperService.makeObjectList(data);
            });
        };

       this.getNationalBibliography = function(sukunimi,etunimi) {
           var rgx ="XZYZ-FHWEJ";
           if (etunimi) {
               if (_.isArray(etunimi)) { etunimi=etunimi[0]; }
               var etu1 = (etunimi === 'Carl Gustaf Emil') ? etunimi :etunimi.split(' ')[0];
               // ^.*Talvela,.*Paavo.*[(].*[)]$
               var rgx = "^.*"+sukunimi+",.*"+etu1+".*[(].*[)]$";
               var qry = nationalBibliographyQry.format("{0}".format());
           }
           var qry = nationalBibliographyQry.format("{0}".format(rgx));
           var end2 = new SparqlService("http://ldf.fi/history/sparql");
           return end2.getObjects(qry).then(function(data) {
               return personMapperService.makeObjectList(data);
           });
       };

        this.getItems = function (regx, controller) {
            var qry = selectorQuery.format("{0}".format(regx));
            return endpoint.getObjects(qry).then(function(data) {
                var arr= personMapperService.makeObjectListNoGrouping(data);
                controller.items=arr;
                return arr;
            });
        };
});

