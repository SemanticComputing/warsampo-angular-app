(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching prisoner data.

      Added one link to ldf.fi Fuseki from a prisoner record to a person instance:
      PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
      INSERT DATA
      {
        GRAPH <http://ldf.fi/warsa/prisoners> {
          <http://ldf.fi/warsa/prisoners/prisoner_858> crm:P70_documents <http://ldf.fi/warsa/actors/person_p753249> .
        }
      }

      info page url for testing:
      http://localhost:9000/fi/persons/page?uri=http:%2F%2Fldf.fi%2Fwarsa%2Factors%2Fperson_p753249
      https://dev.sotasampo.fi/fi/persons/page?uri=http:%2F%2Fldf.fi%2Fwarsa%2Factors%2Fperson_p753249
    */
    angular.module('eventsApp')
    .service('prisonerRepository', function($q, _, AdvancedSparqlService, prisonerMapperService,
                dateUtilService, ENDPOINT_CONFIG) {
        var endpoint = new AdvancedSparqlService(ENDPOINT_CONFIG, prisonerMapperService);

        var prefixes =
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 	' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>	' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX casualties: <http://ldf.fi/schema/narc-menehtyneet1939-45/> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX sf: <http://ldf.fi/functions#>'  +
        ' PREFIX georss: <http://www.georss.org/georss/> ' +
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ' +
        ' PREFIX psc: <http://ldf.fi/schema/warsa/prisoners/> ';

        var prisonerRecordProperties = [
            'birth_date',
            'birth_place',
            'home_place',
            'residence_place',
            'has_occupation',
            'located_in',
            'amount_children',
            'rank',
            'warsa_rank',
            'unit',
            'warsa_unit',
            'time_captured',
            'place_captured',
            'place_captured_battle',
            'place_captured_municipality',
            'time_gone_missing',
            'returned_date',
            'cause_of_death',
            'death_date',
            'death_place',
            'municipality_of_death',
            'burial_place',
            'explanation',
            'flyer',
            'karaganda_card_file',
            'karelian_archive_documents',
            'marital_status',
            'memoirs',
            'photograph',
            'propaganda_magazine',
            'radio_report',
            'recording',
            'russian_interrogation_sheets',
            'winter_war_collection',
            'winter_war_collection_from_moscow',
            'winterwar_card_file',
            'continuation_war_card_file',
            'continuation_war_russian_card_file_461p',
            'continuation_war_russian_card_file_F_465',
            'finnish_return_interrogation_file',
            'other_information',
        ];

        var select = 'SELECT DISTINCT ?id ?name ?properties__id ';
        var qryBody =
        ' { ?id crm:P70_documents <ID> . ' +
        ' ?id a wsc:PrisonerRecord . ' +
        ' ?id skos:prefLabel ?name . }';

        prisonerRecordProperties.forEach(function(prop) {
            select += generatePrisonerSelectRow(prop);
            qryBody += generatePrisonerPropertyQry(prop);
        });

        var prisonerRecordQry = prefixes + select + '{' + qryBody + '}';


        this.getPersonPrisonerRecord = function(id) {
            var qry = prisonerRecordQry.replace(/<ID>/g, '<' + id + '>');
            return endpoint.getObjects(qry).then(function(data) {
                return data[0];
            });
        };

        function generatePrisonerPropertyQry(property) {
            var namespace = property === 'has_occupation' ? 'bioc:' : 'psc:';

            var qry =
            ' UNION { ' +
            '  SELECT DISTINCT * { ' +
            '   ?id crm:P70_documents <ID> . ' +
            '   ?id a wsc:PrisonerRecord . ' +
            '   BIND(1 AS ?properties__id) ' +
            '   ?id <NAMESPACE><PROPERTY> ?properties__<PROPERTY>__id . ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id skos:prefLabel|psc:place ?properties__<PROPERTY>__valueLabel . } ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id psc:order ?properties__<PROPERTY>__order . } ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id psc:date_begin ?properties__<PROPERTY>__date_begin . } ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id psc:date_end ?properties__<PROPERTY>__date_end . } ' +
            '   <NAMESPACE><PROPERTY> skos:prefLabel ?properties__<PROPERTY>__propertyLabel . ' +
            '   <NAMESPACE><PROPERTY> dct:description ?properties__<PROPERTY>__propertyDescription . ' +
            '   OPTIONAL { ' +
            '    [] rdf:subject ?id ; ' +
            '     rdf:predicate <NAMESPACE><PROPERTY> ; ' +
            '     rdf:object ?properties__<PROPERTY>__id ; ' +
            '     dct:source ?properties__<PROPERTY>__source . ' +
            '   } ' +
            '  } ORDER BY ?properties__<PROPERTY>__order ' +
            ' } ';

            return qry.replace(/<PROPERTY>/g, property).replace(/<NAMESPACE>/g, namespace);
        }

        function generatePrisonerSelectRow(property) {
            return '?properties__' + property + '__id ' +
                '?properties__' + property + '__propertyLabel ' +
                '?properties__' + property + '__propertyDescription ' +
                '?properties__' + property + '__valueLabel ' +
                '?properties__' + property + '__source ' +
                '?properties__' + property + '__date_begin ' +
                '?properties__' + property + '__date_end';
        }
    });
})();
