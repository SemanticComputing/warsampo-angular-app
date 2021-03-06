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

        this.getPersonPrisonerRecord = getPersonPrisonerRecord;

        var prefixes =
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 	' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>	' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
        ' PREFIX hipla: <http://ldf.fi/schema/hipla/> ' +
        ' PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/> ' +
        ' PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX sch: <http://schema.org/> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX sf: <http://ldf.fi/functions#>'  +
        ' PREFIX georss: <http://www.georss.org/georss/> ' +
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX wsc: <http://ldf.fi/schema/warsa/> ' +
        ' PREFIX wso: <http://ldf.fi/warsa/sources/> ' +
        ' PREFIX psc: <http://ldf.fi/schema/warsa/prisoners/> ';

        var prisonerRecordProperties = [
            'has_occupation',

            'date_of_birth',
            'family_name',
            'given_names',
            'mother_tongue',
            'municipality_of_birth',

            'additional_information',
            'captivity',
            'cause_of_death',
            'confiscated_possession',
            'date_of_capture',
            'date_of_death',
            'date_of_declaration_of_death',
            'date_of_going_mia',
            'date_of_return',
            'description_of_capture',
            // 'finnish_return_interrogation_file', // not used
            // 'flyer', // not used
            'marital_status',
            'municipality_of_capture',
            'municipality_of_death',
            'municipality_of_domicile',
            'municipality_of_residence',
            'number_of_children',
            'occupation_literal',
            // 'photograph', // not used
            // 'photograph_sotilaan_aani', // not used
            'place_of_burial_literal',
            'place_of_capture_battle_literal',
            'place_of_capture_literal',
            'place_of_death',
            'place_of_going_mia_literal',
            // 'propaganda_magazine', // not used
            // 'radio_report', // not used
            'rank',
            'rank_literal', // not used
            // 'recording', // not used
            // 'sotilaan_aani', // not used
            // 'soviet_card_files', // not used
            'unit',
            'unit_literal', // not used
            // 'winter_war_collection', // not used
            'propaganda_magazine',
            'sotilaan_aani',
            'photograph_sotilaan_aani',
            'propaganda_magazine_link',
            'memoir'
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


        function getPersonPrisonerRecord(id) {
            var qry = prisonerRecordQry.replace(/<ID>/g, '<' + id + '>');
            return endpoint.getObjects(qry).then(function(data) {
                return data[0];
            });
        }

        function generatePrisonerPropertyQry(property) {

            var warsa_schema_props = [
                'date_of_birth',
                'family_name',
                'given_names',
                'mother_tongue',
                'municipality_of_birth',
            ];

            var namespace = property === 'has_occupation' ? 'bioc:' : _.includes(warsa_schema_props, property) ? 'wsc:' : 'psc:';

            var qry =
            ' UNION { ' +
            '  SELECT DISTINCT * { ' +
            '   ?id crm:P70_documents <ID> . ' +
            '   ?id a wsc:PrisonerRecord . ' +
            '   BIND(1 AS ?properties__id) ' +
            '   ?id <NAMESPACE><PROPERTY> ?properties__<PROPERTY>__id . ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id skos:prefLabel|psc:location/skos:prefLabel ?properties__<PROPERTY>__valueLabel . } ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id psc:location ?properties__<PROPERTY>__location . } ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id psc:location_literal ?properties__<PROPERTY>__location_literal . } ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id psc:order ?properties__<PROPERTY>__order . } ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id psc:date_begin ?properties__<PROPERTY>__date_begin . } ' +
            '   OPTIONAL { ?properties__<PROPERTY>__id psc:date_end ?properties__<PROPERTY>__date_end . } ' +
            '   OPTIONAL { <NAMESPACE><PROPERTY> skos:prefLabel ?properties__<PROPERTY>__propertyLabel . } ' +
            '   OPTIONAL { <NAMESPACE><PROPERTY> dct:description ?properties__<PROPERTY>__propertyDescription . } ' +
            '   OPTIONAL { ' +
            '    [] rdf:subject ?id ; ' +
            '     rdf:predicate <NAMESPACE><PROPERTY> ; ' +
            '     rdf:object ?properties__<PROPERTY>__id ; ' +
            '     dct:source/skos:prefLabel ?properties__<PROPERTY>__source . ' +
            '   } ' +
            '   wso:source22 skos:prefLabel ?properties__<PROPERTY>__sourceRegister ' +
            '     ' +
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
                '?properties__' + property + '__sourceRegister ' +
                '?properties__' + property + '__location ' +
                '?properties__' + property + '__location_literal ' +
                '?properties__' + property + '__date_begin ' +
                '?properties__' + property + '__date_end';
        }
    });
})();
