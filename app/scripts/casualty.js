'use strict';

/*
 * Service that provides an interface for fetching casualty data.
 */
angular.module('eventsApp')
    .service('casualtyService', function(SparqlService, objectMapperService) {
        var endpoint = new SparqlService('http://ldf.fi/narc-menehtyneet1939-45/sparql');

        var prefixes = '' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' + 
        ' PREFIX georss: <http://www.georss.org/georss/> ';

        var casualtyLocationsByTimeQry =  prefixes +
        ' SELECT ?id ?point ' +
        ' WHERE { ' +
        '        ?id casualties:kuolinaika ?death_date . ' +
        '        FILTER(?death_date >= "{0}"^^xsd:date && ?death_date <= "{1}"^^xsd:date) ' +
        '        ?id casualties:kuolinkunta ?kunta . ' +
        '        ?kunta georss:point ?point . ' +
        '        FILTER(?point != " ") . ' +
        ' } ';

        this.getCasualtyLocationsByTime = function(start, end) {
            var qry = casualtyLocationsByTimeQry.format(start, end);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };
});

