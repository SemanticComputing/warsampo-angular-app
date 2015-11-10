'use strict';

/*
 * Service that provides an interface for fetching photograph metadata from the WarSa SPARQL endpoint.
 */
angular.module('eventsApp')
    .service('photoService', function($q, SparqlService, objectMapperService, photoMapperService) {
        var endpoint = new SparqlService('http://ldf.fi/warsa/sparql');

        var prefixes = '' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX events: <http://ldf.fi/warsa/events/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX warsaplaces: <http://ldf.fi/warsa/places/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX dctype: <http://purl.org/dc/dcmitype/> ' +
        ' PREFIX dc: <http://purl.org/dc/terms/> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ';

        var photosByPlaceAndTimeQry = prefixes +
        '  SELECT ?id ?created ?description ?place_id ?place_label ?url ?thumbnail_url ?ref_municipality ?ref_place_id ' +
        '  WHERE { ' +
        '     VALUES ?ref_place_id { {0} }    ' +
        '     GRAPH warsa:photographs { ' +
        '       ?id dc:created ?created . ' +
        '         FILTER(?created >= "{1}"^^xsd:date && ?created <= "{2}"^^xsd:date) ' +
        '         ?id skos:prefLabel ?description ;          ' +
        '         sch:contentUrl ?url ;          ' +
        '         sch:thumbnailUrl ?thumbnail_url ;          ' +
        '         dc:spatial ?place_id .    ' +
        '     } ' +
        '     OPTIONAL { ' +
        '       ?ref_place_id geosparql:sfWithin ?ref_municipality . ' +
        '       ?ref_municipality a suo:kunta . ' +
        '     } ' +
        '     OPTIONAL { ?place_id geosparql:sfWithin ?municipality . ?municipality a suo:kunta . } ' +
        '     FILTER(?place_id = ?ref_place_id || ?place_id = ?ref_municipality || ?ref_place_id = ?municipality) ' +
        '     ?place_id skos:prefLabel ?place_label . ' +
        ' }  ';

        var photosByTimeQry =  prefixes +
        ' SELECT ?id ?created ?description ?url ?thumbnail_url ?place_id ' +
        ' WHERE { ' +
        '     GRAPH warsa:photographs { ' +
        '        ?id dc:created ?created . ' +
        '        FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        '        ?id skos:prefLabel ?description ; ' +
        '           sch:contentUrl ?url . ' +
        '           sch:thumbnailUrl ?thumbnail_url . ' +
        '        OPTIONAL { ?id dc:spatial ?place_id . } ' +
        '     } ' +
        ' } ';

        var minimalPhotosWithPlaceByTimeQry = prefixes + 
        ' SELECT DISTINCT ?created ?place_id ?municipality_id' +
        ' WHERE { ' +
        '     GRAPH warsa:photographs { ' +
        '       ?id dc:created ?created . ' +
        '       FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        '       ?id skos:prefLabel ?description ; ' +
        '       dc:spatial ?place_id . ' +
        '     } ' +
        '     OPTIONAL { ?place_id geosparql:sfWithin ?municipality_id . ?municipality_id a suo:kunta . } ' +
        ' } ' + 
        ' ORDER BY ?created ';

        var minimalPhotosByTimeQry = prefixes + 
        ' SELECT DISTINCT ?created' +
        ' WHERE { ' +
        '     GRAPH warsa:photographs { ' +
        '       ?id dc:created ?created . ' +
        '       FILTER(?created >= "{0}"^^xsd:date && ?created <= "{1}"^^xsd:date) ' +
        '     } ' +
        ' } ' + 
        ' ORDER BY ?created ';

        this.getPhotosByPlaceAndTimeSpan = function(place_id, start, end) {
            var qry;
            if (_.isArray(place_id)) {
                place_id = "<{0}>".format(place_id.join("> <"));
                qry = photosByPlaceAndTimeQry.format(place_id, start, end);
            } else if (place_id) {
                place_id = "<{0}>".format(place_id);
                qry = photosByPlaceAndTimeQry.format(place_id, start, end);
            } else {
                qry = photosByTimeQry.format(start, end);
            }
            return endpoint.getObjects(qry).then(function(data) {
                return photoMapperService.makeObjectList(data);
            });
        };

        this.getDistinctPhotoData = function(start, end, getPlace) {
            // start and end as strings
            var qry;
            if (getPlace) {
                qry = minimalPhotosWithPlaceByTimeQry.format(start, end);
            } else {
                qry = minimalPhotosByTimeQry.format(start, end);
            }
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectListNoGrouping(data);
            });
        };

        this.getRelatedPhotosForEvent = function(event, photoSettings) {
            var images = [];
            var place_ids;
            if (photoSettings.inProximity) {
                place_ids = _.pluck(event.places, 'id');
                if (!place_ids) {
                    return $q.when();
                }
            }
            return this.getPhotosByPlaceAndTimeSpan(place_ids, 
                    changeDateAndFormat(event.start_time, -photoSettings.beforeOffset), 
                    changeDateAndFormat(event.end_time, photoSettings.afterOffset))
            .then(function(imgs) {
                imgs.forEach(function(img) {
                    img.thumbnail = img.url.replace("_r500", "_r100");
                    images.push(img);
                });
                return images;
            });
        };

        this.getByTimeSpan = function(start, end) {
            // start and end as strings
            return this.getPhotosByPlaceAndTimeSpan(null, start, end);
        };

        function changeDateAndFormat(date, days) {
            var d = new Date(date);
            d.setDate(d.getDate() + days);
            return d.toISODateString();
        }
});

