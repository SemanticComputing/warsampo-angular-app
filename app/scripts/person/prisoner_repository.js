(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching prisoner data.
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
        ' PREFIX atypes: <http://ldf.fi/warsa/actors/actor_types/> 	' +
        ' PREFIX warsa: <http://ldf.fi/warsa/> ' +
        ' PREFIX photos: <http://ldf.fi/warsa/photographs/> ' +
        ' PREFIX geosparql: <http://www.opengis.net/ont/geosparql#> ' +
        ' PREFIX suo: <http://www.yso.fi/onto/suo/> ' +
        ' PREFIX sf: <http://ldf.fi/functions#>'  +
        ' PREFIX georss: <http://www.georss.org/georss/> ' +
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX prisoners: <http://ldf.fi/schema/warsa/prisoners/> ';

        // testing with http://ldf.fi/warsa/actors/person_p525088
        // full url: http://localhost:9000/fi/persons/page?uri=http:%2F%2Fldf.fi%2Fwarsa%2Factors%2Fperson_p525088

        // http://ldf.fi/warsa/prisoners/prisoner_571

        // ldf.fi fuseki:
        // http://ldf.fi/warsa/actors/person_753249
        // http://localhost:9000/fi/persons/page?uri=http:%2F%2Fldf.fi%2Fwarsa%2Factors%2Fperson_p753249

        var prisonerRecordProperties = [
            'birth_date',
            'birth_place',
            //'home_place',
            //'residence_place',
            'marital_status',
            'amount_children',
            'has_occupation',
            'rank',
            'unit',
            'time_captured',
            'place_captured_municipality',
            'place_captured',
            'place_captured_battle',
            'explanation',
            'camps_and_hospitals',
            'returned_date',
            'death_date',
            'death_place',
            'cause_of_death',
            'burial_place',
            'photograph',
            'other_information',
            'karaganda_card_file',
            'continuation_war_card_file',
            'continuation_war_russian_card_file',
            'winter_war_collection',
            'winter_war_collection_from_moscow',
            'flyer',
            'karelian_archive_documents',
            'recording'
        ];

        var select = 'SELECT DISTINCT ?id ?name ?properties__id ';
        var qryBody =
        ' ?id crm:P70_documents <ID> . ' +
        ' ?id a prisoners:PrisonerOfWar . ' +
        ' ?id skos:prefLabel ?name . ' +
        ' BIND("properties" AS ?properties__id ) ';

        prisonerRecordProperties.forEach(function(prop) {
            select += generatePrisonerSelectRow(prop);
            qryBody += generatePrisonerPropertyQry(prop);
        });

        var prisonerRecordQry = prefixes + select + '{' + qryBody + '}';


        this.getPersonPrisonerRecord = function(id, lang) {
            lang = lang || 'fi';
            var qry = prisonerRecordQry
                .replace(/<ID>/g, '<' + id + '>')
                .replace(/<LANG>/g, lang);
            return endpoint.getObjects(qry).then(function(data) {
                return data[0];
            });
        };

        function generatePrisonerPropertyQry(property) {
            var namespace = property === 'has_occupation' ? 'bioc:' : 'prisoners:';

            var qry =
            ' OPTIONAL { ' +
            '  ?rei_<PROPERTY> rdf:subject ?id . ' +
            '  ?id <NAMESPACE><PROPERTY> ?properties__<PROPERTY>__id . ' +
            '  OPTIONAL { ?properties__<PROPERTY>__id skos:prefLabel ?properties__<PROPERTY>__valueLabel . } ' +
            //'  ?properties__<PROPERTY>__id skos:prefLabel ?properties__<PROPERTY>__valueLabel . ' +
            '  <NAMESPACE><PROPERTY> skos:prefLabel ?properties__<PROPERTY>__propertyLabel . ' +
            '  FILTER(lang(?properties__<PROPERTY>__propertyLabel)="<LANG>") . ' +
            '  ?rei_<PROPERTY> rdf:predicate <NAMESPACE><PROPERTY> . ' +
            '  ?rei_<PROPERTY> rdf:object ?properties__<PROPERTY>__id . ' +
            '  ?rei_<PROPERTY> dct:source ?properties__<PROPERTY>__source . ' +
            ' } ' +
            ' OPTIONAL { ' +
            '  ?id <NAMESPACE><PROPERTY> ?properties__<PROPERTY>__id . ' +
            '  OPTIONAL { ?properties__<PROPERTY>__id skos:prefLabel ?properties__<PROPERTY>__valueLabel . } ' +
            //' { ?properties__<PROPERTY>__id skos:prefLabel ?properties__<PROPERTY>__valueLabel . } ' +
            '  <NAMESPACE><PROPERTY> skos:prefLabel ?properties__<PROPERTY>__propertyLabel . ' +
            '  FILTER(lang(?properties__<PROPERTY>__propertyLabel)="<LANG>") . ' +
            ' } ';

            return qry.replace(/<PROPERTY>/g, property).replace(/<NAMESPACE>/g, namespace);
        }

        function generatePrisonerSelectRow(property) {
            return '?properties__' + property + '__id ?properties__' + property + '__propertyLabel ?properties__' + property + '__valueLabel ?properties__' + property + '__source ';
        }
    });
})();
