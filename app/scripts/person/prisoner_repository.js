(function() {
    'use strict';
    /* eslint-disable angular/no-service-method */

    /*
    * Service that provides an interface for fetching prisoner data.
    */
    angular.module('eventsApp')
    .service('prisonerRepository', function($q, _, SparqlService, objectMapperService,
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
        ' PREFIX dc: <http://purl.org/dc/elements/1.1/> ' +
        ' PREFIX prisoners: <http://ldf.fi/schema/warsa/prisoners/> ';

        var personPrisonerRecordQry = prefixes +
        'SELECT ?id ?prefLabel ?birth_date ?birth_date_lbl ?birth_place ?birth_place_lbl ?marital_status ' +
        '?marital_status_lbl ?amount_children ?amount_children_lbl ?amount_children_source ?has_occupation ?has_occupation_lbl ' +
        '?rank ?rank_lbl ?unit ?unit_lbl ?time_captured ?time_captured_lbl ?place_captured_municipality ' +
        '?place_captured_municipality_lbl ?explanation ?explanation_lbl ?camps_and_hospitals ' +
        '?camps_and_hospitals_lbl ?returned_date ?returned_date_lbl ?death_date ?death_date_lbl ?burial_place ' +
        '?burial_place_lbl ?photograph ?photograph_lbl ?karaganda_card_file ?karaganda_card_file_lbl ' +
        '?continuation_war_card_file ?continuation_war_card_file_lbl ?continuation_war_russian_card_file ' +
        '?continuation_war_russian_card_file_lbl ?winter_war_collection ?winter_war_collection_lbl ' +
        '?winter_war_collection_from_moscow ?winter_war_collection_from_moscow_lbl ?flyer ?flyer_lbl ' +
        '?karelian_archive_documents ?karelian_archive_documents_lbl ?recording ?recording_lbl ' +
        'WHERE { ' +
        '   ?id crm:P70_documents <{0}> . ' +
        '   ?id a prisoners:PrisonerOfWar . ' +
        '   ?id skos:prefLabel ?prefLabel . ' +
        '   OPTIONAL { ' +
        '     ?id prisoners:birth_date ?birth_date . ' +
        '     prisoners:birth_date skos:prefLabel ?birth_date_lbl . ' +
        '     FILTER( lang(?birth_date_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:birth_place ?birth_place . ' +
        '     prisoners:birth_place skos:prefLabel ?birth_place_lbl . ' +
        '     FILTER( lang(?birth_place_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:marital_status ?marital_status . ' +
        '     prisoners:marital_status skos:prefLabel ?marital_status_lbl . ' +
        '     FILTER( lang(?marital_status_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:amount_children ?amount_children . ' +
        '     prisoners:amount_children skos:prefLabel ?amount_children_lbl . ' +
        '     FILTER( lang(?amount_children_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '       ?rei a rdf:Statement . ' +
        '       ?rei rdf:subject ?id . ' +
        '       ?rei rdf:predicate prisoners:amount_children . ' +
        '       ?rei rdf:object ?amount_children . ' +
        '       ?rei dc:source ?amount_children_source . ' +
        '       OPTIONAL { ' +
        '         ?rei prisoners:date_begin ?amount_children_date_begin .' +
        '         ?rei prisoners:date_end ?amount_children_date_end .' +
        '       } ' +
        '     } ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id bioc:has_occupation ?has_occupation . ' +
        '     bioc:has_occupation skos:prefLabel ?has_occupation_lbl . ' +
        '     FILTER( lang(?has_occupation_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:rank ?rank . ' +
        '     prisoners:rank skos:prefLabel ?rank_lbl . ' +
        '     FILTER( lang(?rank_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:unit ?unit . ' +
        '     prisoners:unit skos:prefLabel ?unit_lbl . ' +
        '     FILTER( lang(?unit_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:time_captured ?time_captured . ' +
        '     prisoners:time_captured skos:prefLabel ?time_captured_lbl . ' +
        '     FILTER( lang(?time_captured_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:place_captured_municipality ?place_captured_municipality . ' +
        '     prisoners:place_captured_municipality skos:prefLabel ?place_captured_municipality_lbl . ' +
        '     FILTER( lang(?place_captured_municipality_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:explanation ?explanation . ' +
        '     prisoners:explanation skos:prefLabel ?explanation_lbl . ' +
        '     FILTER( lang(?explanation_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:camps_and_hospitals ?camps_and_hospitals . ' +
        '     prisoners:camps_and_hospitals skos:prefLabel ?camps_and_hospitals_lbl . ' +
        '     FILTER( lang(?camps_and_hospitals_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:returned_date ?returned_date . ' +
        '     prisoners:returned_date skos:prefLabel ?returned_date_lbl . ' +
        '     FILTER( lang(?returned_date_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:death_date ?death_date . ' +
        '     prisoners:death_date skos:prefLabel ?death_date_lbl . ' +
        '     FILTER( lang(?death_date_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:death_place ?death_place . ' +
        '     prisoners:death_place skos:prefLabel ?death_place_lbl . ' +
        '     FILTER( lang(?death_place_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:burial_place ?burial_place . ' +
        '     prisoners:burial_place skos:prefLabel ?burial_place_lbl . ' +
        '     FILTER( lang(?burial_place_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:photograph ?photograph . ' +
        '     prisoners:photograph skos:prefLabel ?photograph_lbl . ' +
        '     FILTER( lang(?photograph_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:karaganda_card_file ?karaganda_card_file . ' +
        '     prisoners:karaganda_card_file skos:prefLabel ?karaganda_card_file_lbl . ' +
        '     FILTER( lang(?karaganda_card_file_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:continuation_war_card_file ?continuation_war_card_file . ' +
        '     prisoners:continuation_war_card_file skos:prefLabel ?continuation_war_card_file_lbl . ' +
        '     FILTER( lang(?continuation_war_card_file_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:continuation_war_russian_card_file ?continuation_war_russian_card_file . ' +
        '     prisoners:continuation_war_russian_card_file skos:prefLabel ?continuation_war_russian_card_file_lbl . ' +
        '     FILTER( lang(?continuation_war_russian_card_file_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:winter_war_collection ?winter_war_collection . ' +
        '     prisoners:winter_war_collection skos:prefLabel ?winter_war_collection_lbl . ' +
        '     FILTER( lang(?winter_war_collection_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:winter_war_collection_from_moscow ?winter_war_collection_from_moscow . ' +
        '     prisoners:winter_war_collection_from_moscow skos:prefLabel ?winter_war_collection_from_moscow_lbl . ' +
        '     FILTER( lang(?winter_war_collection_from_moscow_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:flyer ?flyer . ' +
        '     prisoners:flyer skos:prefLabel ?flyer_lbl . ' +
        '     FILTER( lang(?flyer_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:karelian_archive_documents ?karelian_archive_documents . ' +
        '     prisoners:karelian_archive_documents skos:prefLabel ?karelian_archive_documents_lbl . ' +
        '     FILTER( lang(?karelian_archive_documents_lbl)="{1}" ) ' +
        '   }' +
        '   OPTIONAL { ' +
        '     ?id prisoners:recording ?recording . ' +
        '     prisoners:recording skos:prefLabel ?recording_lbl . ' +
        '     FILTER( lang(?recording_lbl)="{1}" ) ' +
        '   }' +
        '}' ;


        this.getPersonPrisonerRecord = function(id, lang) {
            var qry = personPrisonerRecordQry.format(id, lang || 'fi');
            console.log(qry);
            return endpoint.getObjects(qry).then(function(data) {
                return objectMapperService.makeObjectList(data);
            });
        };
    });
})();
