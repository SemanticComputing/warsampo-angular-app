(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching prisoner data.
    */
    angular.module('eventsApp')
    .service('prisonerRepository', function($q, _, SparqlService, objectMapperService, dateUtilService,
            ENDPOINT_CONFIG) {
        var endpoint = new SparqlService(ENDPOINT_CONFIG);

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
        //' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX dc: <http://purl.org/dc/terms/> ' +
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
          'home_place',
          'residence_place',
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
          'other_information',
          'returned_date',
          'death_date',
          'cause_of_death',
          'burial_place',
          'photograph',
          'karaganda_card_file',
          'continuation_war_card_file',
          'continuation_war_russian_card_file',
          'winter_war_collection',
          'winter_war_collection_from_moscow',
          'flyer',
          'karelian_archive_documents',
          'recording',
        ];

        this.getPersonPrisonerRecord = function(id, lang) {

            var prisonerRecordQry = prefixes;
            prisonerRecordQry += 'SELECT DISTINCT ?id ?prefLabel ?prefLabel_lbl ';

            for (var i = 0; i < prisonerRecordProperties.length; i++) {
                    prisonerRecordQry += generatePrisonerSelectRow(prisonerRecordProperties[i]);
            }

            prisonerRecordQry += 'WHERE { ' +
            '   ?id crm:P70_documents <{0}> . ' +
            '   ?id a prisoners:PrisonerOfWar . ' +
            '   ?id skos:prefLabel ?prefLabel . ' +
            '   BIND("Nimi" AS ?prefLabel_lbl ) ' +
            '   OPTIONAL { ?rei rdf:subject ?id . } ';

            for (var i = 0; i < prisonerRecordProperties.length; i++) {
                    prisonerRecordQry += generatePrisonerPropertyQry(prisonerRecordProperties[i]);
            }

            prisonerRecordQry += '} ';
            var qry = prisonerRecordQry.format(id, lang || 'fi');
            return endpoint.getObjects(qry).then(function(data) {
                //console.log(objectMapperService.makeObjectList(data));
                var obj = objectMapperService.makeObjectList(data)[0];
                //console.log(makePropertyList(obj));
                return makePropertyList(obj);
            });
        };

       function generatePrisonerPropertyQry(property) {
          var valueQry =  '?id prisoners:' + property + ' ?' + property + ' . ';
          if (property == 'rank') {
            valueQry = '?id prisoners:' + property + ' ?' + property + '_id . '+
                       '?' + property + '_id skos:prefLabel ?' + property + ' . ' ;
          }

          var qry =
          '   OPTIONAL { ' +
                valueQry +
          '     prisoners:' + property + ' skos:prefLabel ?' + property + '_lbl . ' +
          '     FILTER( lang(?' + property + '_lbl)="{1}" ) ' +
          '     ?rei rdf:predicate prisoners:' + property + ' . ' +
          '     ?rei rdf:object ?' + property + ' . ' +
          '     ?rei dc:source ?' + property + '_source . ' +
          '   } ' +
          '   OPTIONAL { ' +
                valueQry +
          '     prisoners:' + property + ' skos:prefLabel ?' + property + '_lbl . ' +
          '     FILTER( lang(?' + property + '_lbl)="{1}" ) ' +
          '   } ';
          //'   BIND ( if (BOUND (?' + property + '_source_temp), ?' + property + '_source_temp, CONCAT("no_source_for_", STR(?' + property + ')) )  as ?' + property + '_source ) ';
          return qry;
        }

        function generatePrisonerSelectRow(property) {
           return '?' + property + ' ?' + property + '_lbl ?' + property + '_source ';
         }

        function makePropertyList(prisonerObj) {
          var propertyList = [];

          console.log(prisonerObj);


          if (prisonerObj.hasOwnProperty('prefLabel')) {
            propertyList.push(makePropertyObject('prefLabel', prisonerObj.prefLabel_lbl, prisonerObj.prefLabel, prisonerObj.prefLabel_source));
          }
          if (prisonerObj.hasOwnProperty('birth_date')) {
            propertyList.push(makePropertyObject('birth_date', prisonerObj.birth_date_lbl, prisonerObj.birth_date, prisonerObj.birth_date_source));
          }
          if (prisonerObj.hasOwnProperty('birth_place')) {
            propertyList.push(makePropertyObject('birth_place', prisonerObj.birth_place_lbl, prisonerObj.birth_place, prisonerObj.birth_place_source));
          }
          // if (prisonerObj.hasOwnProperty('home_place')) {
          //   propertyList.push(makePropertyObject('home_place', prisonerObj.home_place_lbl, prisonerObj.home_place, prisonerObj.home_place_source));
          // }
          // if (prisonerObj.hasOwnProperty('residence_place')) {
          //   propertyList.push(makePropertyObject('residence_place', prisonerObj.residence_place_lbl, prisonerObj.residence_place, prisonerObj.residence_place_source));
          // }
          if (prisonerObj.hasOwnProperty('marital_status')) {
            propertyList.push(makePropertyObject('marital_status', prisonerObj.marital_status_lbl, prisonerObj.marital_status, prisonerObj.marital_status_source));
          }
          if (prisonerObj.hasOwnProperty('amount_children')) {
            propertyList.push(makePropertyObject('amount_children', prisonerObj.amount_children_lbl, prisonerObj.amount_children, prisonerObj.amount_children_source));
          }
          if (prisonerObj.hasOwnProperty('has_occupation')) {
            propertyList.push(makePropertyObject('has_occupation', prisonerObj.has_occupation_lbl, prisonerObj.has_occupation, prisonerObj.has_occupation_source));
          }
          if (prisonerObj.hasOwnProperty('rank')) {
            propertyList.push(makePropertyObject('rank', prisonerObj.rank_lbl, prisonerObj.rank, prisonerObj.rank_source));
          }
          if (prisonerObj.hasOwnProperty('unit')) {
            propertyList.push(makePropertyObject('unit', prisonerObj.unit_lbl, prisonerObj.unit, prisonerObj.unit_source));
          }
          if (prisonerObj.hasOwnProperty('time_captured')) {
            propertyList.push(makePropertyObject('time_captured', prisonerObj.time_captured_lbl, prisonerObj.time_captured, prisonerObj.time_captured_source));
          }
          if (prisonerObj.hasOwnProperty('place_captured_municipality')) {
            propertyList.push(makePropertyObject('place_captured_municipality', prisonerObj.place_captured_municipality_lbl, prisonerObj.place_captured_municipality, prisonerObj.place_captured_municipality_source));
          }
          if (prisonerObj.hasOwnProperty('place_captured')) {
            propertyList.push(makePropertyObject('place_captured', prisonerObj.place_captured_lbl, prisonerObj.place_captured, prisonerObj.place_captured_source));
          }
          if (prisonerObj.hasOwnProperty('place_captured_battle')) {
            propertyList.push(makePropertyObject('place_captured_battle', prisonerObj.place_captured_battle_lbl, prisonerObj.place_captured_battle, prisonerObj.place_captured_battle_source));
          }
          if (prisonerObj.hasOwnProperty('explanation')) {
            propertyList.push(makePropertyObject('explanation', prisonerObj.explanation_lbl, prisonerObj.explanation, prisonerObj.explanation_source));
          }
          if (prisonerObj.hasOwnProperty('camps_and_hospitals')) {
            propertyList.push(makePropertyObject('camps_and_hospitals', prisonerObj.camps_and_hospitals_lbl, prisonerObj.camps_and_hospitals, prisonerObj.camps_and_hospitals_source));
          }
          // if (prisonerObj.hasOwnProperty('other_information')) {
          //   propertyList.push(makePropertyObject('other_information', prisonerObj.other_information_lbl, prisonerObj.other_information, prisonerObj.other_information_source));
          // }
          if (prisonerObj.hasOwnProperty('returned_date')) {
            propertyList.push(makePropertyObject('returned_date', prisonerObj.returned_date_lbl, prisonerObj.returned_date, prisonerObj.returned_date_source));
          }
          if (prisonerObj.hasOwnProperty('death_date')) {
            propertyList.push(makePropertyObject('death_date', prisonerObj.death_date_lbl, prisonerObj.death_date, prisonerObj.death_date_source));
          }
          if (prisonerObj.hasOwnProperty('death_place')) {
            propertyList.push(makePropertyObject('death_place', prisonerObj.death_place_lbl, prisonerObj.death_place, prisonerObj.death_place_source));
          }
          if (prisonerObj.hasOwnProperty('cause_of_death')) {
            propertyList.push(makePropertyObject('cause_of_death', prisonerObj.cause_of_death_lbl, prisonerObj.cause_of_death, prisonerObj.cause_of_death_source));
          }
          if (prisonerObj.hasOwnProperty('burial_place')) {
            propertyList.push(makePropertyObject('burial_place', prisonerObj.burial_place_lbl, prisonerObj.burial_place, prisonerObj.burial_place_source));
          }
          if (prisonerObj.hasOwnProperty('photograph')) {
            propertyList.push(makePropertyObject('photograph', prisonerObj.photograph_lbl, prisonerObj.photograph, prisonerObj.photograph_source));
          }
          if (prisonerObj.hasOwnProperty('karaganda_card_file')) {
            propertyList.push(makePropertyObject('karaganda_card_file', prisonerObj.karaganda_card_file_lbl, prisonerObj.karaganda_card_file, prisonerObj.karaganda_card_file_source));
          }
          if (prisonerObj.hasOwnProperty('continuation_war_card_file')) {
            propertyList.push(makePropertyObject('continuation_war_card_file', prisonerObj.continuation_war_card_file_lbl, prisonerObj.continuation_war_card_file, prisonerObj.continuation_war_card_file_source));
          }
          if (prisonerObj.hasOwnProperty('continuation_war_russian_card_file')) {
            propertyList.push(makePropertyObject('continuation_war_russian_card_file', prisonerObj.continuation_war_russian_card_file_lbl, prisonerObj.continuation_war_russian_card_file, prisonerObj.continuation_war_russian_card_file_source));
          }
          if (prisonerObj.hasOwnProperty('winter_war_collection')) {
            propertyList.push(makePropertyObject('winter_war_collection', prisonerObj.winter_war_collection_lbl, prisonerObj.winter_war_collection, prisonerObj.winter_war_collection_source));
          }
          if (prisonerObj.hasOwnProperty('flyer')) {
            propertyList.push(makePropertyObject('flyer', prisonerObj.flyer_lbl, prisonerObj.flyer, prisonerObj.flyer_source));
          }
          if (prisonerObj.hasOwnProperty('karelian_archive_documents')) {
            propertyList.push(makePropertyObject('karelian_archive_documents', prisonerObj.karelian_archive_documents_lbl, prisonerObj.karelian_archive_documents, prisonerObj.karelian_archive_documents_source));
          }
          if (prisonerObj.hasOwnProperty('recording')) {
            propertyList.push(makePropertyObject('recording', prisonerObj.recording_lbl, prisonerObj.recording, prisonerObj.recording_source));
          }

          return propertyList;
        }

        function makePropertyObject(propertyKey, propertyLabel, value, source) {
          if ( propertyKey == 'birth_date' || propertyKey == 'time_captured'
          || propertyKey == 'returned_date' || propertyKey == 'death_date' ) {
            if (_.isArray(value)) {
                for (var i = 0; i < value.length; i++) {
                  value[i] = dateUtilService.formatDate(value[i]);
                }
            } else {
              value = dateUtilService.formatDate(value);
            }
          }

          return {  'propertyKey' : propertyKey,
                    'propertyLabel': propertyLabel,
                    'value':value,
                    'source': source };
        }





    });
})();
