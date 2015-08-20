'use strict';

/*
 * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
    .service('photoService', function(SparqlService, objectMapperService) {
        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var photoQry = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX hipla: <http://ldf.fi/schema/hipla/> 
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX sch: <http://schema.org/>
PREFIX events: <http://ldf.fi/warsa/events/>
PREFIX photos: <http://ldf.fi/warsa/photographs/>
PREFIX dctype: <http://purl.org/dc/dcmitype/>
PREFIX dc: <http://purl.org/dc/terms/>
PREFIX geosparql: <http://www.opengis.net/ont/geosparql#>
            
SELECT ?id ?created ?description ?place_id ?place_label ?url ?lat ?lon ?polygon ?type
WHERE {
 VALUES ?ref_place_id { {0} }
 ?id a dctype:Image ;
       skos:prefLabel ?description ;
       dc:created ?created ;
       sch:contentUrl ?url ;
       dc:spatial ?place_id .
  OPTIONAL { ?ref_place_id geosparql:sfWithin ?ref_municipality . }
  OPTIONAL { ?place_id geosparql:sfWithin ?municipality . }
  FILTER(?place_id = ?ref_place_id || ?place_id = ?ref_municipality || ?ref_place_id = ?municipality)
  FILTER(?created >= "{1}"^^xsd:date && ?created <= "{2}"^^xsd:date)
  ?place_id skos:prefLabel ?place_label . 
}
`;

        this.getPhotosByPlaceAndTimeSpan = function(place_id, start, end) {
            if (_.isArray(place_id)) {
                place_id = "<" + place_id.join("> <").slice(0, -2);
            } else {
                place_id = "<{0}>".format(place_id);
            }
            var qry = photoQry.format(place_id, start, end);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };
});

