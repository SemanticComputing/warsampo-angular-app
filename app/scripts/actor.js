'use strict';

/*
 * Service that provides an interface for fetching actor data.
 */
angular.module('eventsApp')
    .service('actorService', function($q, SparqlService, personMapperService) {
        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var prefixes = '' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
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
                return personMapperService.makeObjectList(data);
            });
        };

});

