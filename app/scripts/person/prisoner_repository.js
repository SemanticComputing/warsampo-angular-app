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

        // test with http://ldf.fi/warsa/actors/person_p525088
        // http://ldf.fi/warsa/prisoners/prisoner_571

        var personPrisonerRecordQry = prefixes +
        'SELECT ?id ?prefLabel ' +
        '?birth_date ?birth_date_lbl ?birth_date_source ' +
        '?birth_place ?birth_place_lbl ?birth_place_source ' +
        '?marital_status ?marital_status_lbl ?marital_status_source ' +
        '?amount_children ?amount_children_lbl ?amount_children_source ' +
        '?has_occupation ?has_occupation_lbl ?has_occupation_source ' +
        '?rank ?rank_lbl ?rank_source ' +
        '?unit ?unit_lbl ?unit_source ' +
        '?time_captured ?time_captured_lbl ?time_captured_source ' +
        '?place_captured_municipality ?place_captured_municipality_lbl ?place_captured_source ' +
        '?explanation ?explanation_lbl ?explanation_source ' +
        '?camps_and_hospitals ?camps_and_hospitals_lbl ?camps_and_hospitals_source ' +
        '?returned_date ?returned_date_lbl ?returned_source ' +
        '?death_date ?death_date_lbl ?death_date_source ' +
        '?burial_place ?burial_place_lbl ?burial_source ' +
        '?photograph ?photograph_lbl ?photograph_source ' +
        '?karaganda_card_file ?karaganda_card_file_lbl ?karaganda_card_source ' +
        '?continuation_war_card_file ?continuation_war_card_file_lbl ?continuation_war_card_file_source ' +
        '?continuation_war_russian_card_file ?continuation_war_russian_card_file_lbl ?continuation_war_russian_card_file_source' +
        '?winter_war_collection ?winter_war_collection_lbl ?winter_war_collection_source ' +
        '?winter_war_collection_from_moscow ?winter_war_collection_from_moscow_lbl ?winter_war_collection_from_moscow_source ' +
        '?flyer ?flyer_lbl ?flyer_source ' +
        '?karelian_archive_documents ?karelian_archive_documents_lbl ?karelian_archive_documents_source ' +
        '?recording ?recording_lbl ?recording_source ' +
        'WHERE { ' +
        '   ?id crm:P70_documents <{0}> . ' +
        '   ?id a prisoners:PrisonerOfWar . ' +
        '   ?id skos:prefLabel ?prefLabel . ' +
        '   OPTIONAL { ' +
        '     ?id prisoners:birth_date ?birth_date . ' +
        '     prisoners:birth_date skos:prefLabel ?birth_date_lbl . ' +
        '     FILTER( lang(?birth_date_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '          ?rei a rdf:Statement . ' +
        '          ?rei rdf:subject ?id . ' +
        '          ?rei rdf:predicate prisoners:birth_date . ' +
        '          ?rei rdf:object ?birth_date . ' +
        '          ?rei dc:source ?birth_date_source_temp ' +
        '     } ' +
        '   BIND ( if (BOUND (?birth_date_source_temp), ?birth_date_source_temp, CONCAT("no_source_for_", STR(?birth_date)) )  as ?birth_date_source )  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id prisoners:birth_place ?birth_place . ' +
        '     prisoners:birth_place skos:prefLabel ?birth_place_lbl . ' +
        '     FILTER( lang(?birth_place_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '          ?rei a rdf:Statement . ' +
        '          ?rei rdf:subject ?id . ' +
        '          ?rei rdf:predicate prisoners:birth_place . ' +
        '          ?rei rdf:object ?birth_place . ' +
        '          ?rei dc:source ?birth_place_source_temp ' +
        '     } ' +
        '   BIND ( if (BOUND (?birth_place_source_temp), ?birth_place_source_temp, CONCAT("no_source_for_", STR(?birth_place)) )  as ?birth_place_source )  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id prisoners:marital_status ?marital_status . ' +
        '     prisoners:marital_status skos:prefLabel ?marital_status_lbl . ' +
        '     FILTER( lang(?marital_status_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '          ?rei a rdf:Statement . ' +
        '          ?rei rdf:subject ?id . ' +
        '          ?rei rdf:predicate prisoners:marital_status . ' +
        '          ?rei rdf:object ?marital_status . ' +
        '          ?rei dc:source ?marital_status_source_temp ' +
        '     } ' +
        '   BIND ( if (BOUND (?marital_status_source_temp), ?marital_status_source_temp, CONCAT("no_source_for_", STR(?marital_status)) )  as ?marital_status_source )  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id prisoners:amount_children ?amount_children . ' +
        '     prisoners:amount_children skos:prefLabel ?amount_children_lbl . ' +
        '     FILTER( lang(?amount_children_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '          ?rei a rdf:Statement . ' +
        '          ?rei rdf:subject ?id . ' +
        '          ?rei rdf:predicate prisoners:amount_children . ' +
        '          ?rei rdf:object ?amount_children . ' +
        '          ?rei dc:source ?amount_children_source_temp ' +
        '     } ' +
        '   BIND ( if (BOUND (?amount_children_source_temp), ?amount_children_source_temp, CONCAT("no_source_for_", STR(?amount_children)) )  as ?amount_children_source )  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id bioc:has_occupation ?has_occupation . ' +
        '     bioc:has_occupation skos:prefLabel ?has_occupation_lbl . ' +
        '     FILTER( lang(?has_occupation_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '          ?rei a rdf:Statement . ' +
        '          ?rei rdf:subject ?id . ' +
        '          ?rei rdf:predicate bioc:has_occupation . ' +
        '          ?rei rdf:object ?has_occupation . ' +
        '          ?rei dc:source ?has_occupation_source_temp ' +
        '     } ' +
        '   BIND ( if (BOUND (?has_occupation_source_temp), ?has_occupation_source_temp, CONCAT("no_source_for_", STR(?has_occupation)) )  as ?has_occupation_source )  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id prisoners:rank ?rank . ' +
        '     prisoners:rank skos:prefLabel ?rank_lbl . ' +
        '     FILTER( lang(?rank_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '          ?rei a rdf:Statement . ' +
        '          ?rei rdf:subject ?id . ' +
        '          ?rei rdf:predicate prisoners:rank . ' +
        '          ?rei rdf:object ?rank . ' +
        '          ?rei dc:source ?rank_source_temp ' +
        '     } ' +
        '   BIND ( if (BOUND (?rank_source_temp), ?rank_source_temp, CONCAT("no_source_for_", STR(?rank)) )  as ?rank_source )  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id prisoners:unit ?unit . ' +
        '     prisoners:unit skos:prefLabel ?unit_lbl . ' +
        '     FILTER( lang(?unit_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '          ?rei a rdf:Statement . ' +
        '          ?rei rdf:subject ?id . ' +
        '          ?rei rdf:predicate prisoners:unit . ' +
        '          ?rei rdf:object ?unit . ' +
        '          ?rei dc:source ?unit_source_temp ' +
        '     } ' +
        '   BIND ( if (BOUND (?unit_source_temp), ?unit_source_temp, CONCAT("no_source_for_", STR(?unit)) )  as ?unit_source )  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id prisoners:time_captured ?time_captured . ' +
        '     prisoners:time_captured skos:prefLabel ?time_captured_lbl . ' +
        '     FILTER( lang(?time_captured_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '          ?rei a rdf:Statement . ' +
        '          ?rei rdf:subject ?id . ' +
        '          ?rei rdf:predicate prisoners:time_captured . ' +
        '          ?rei rdf:object ?time_captured . ' +
        '          ?rei dc:source ?time_captured_source_temp ' +
        '     } ' +
        '   BIND ( if (BOUND (?time_captured_source_temp), ?time_captured_source_temp, CONCAT("no_source_for_", STR(?time_captured)) )  as ?time_captured_source )  ' +
        '   } ' +
        '   OPTIONAL { ' +
        '     ?id prisoners:place_captured ?place_captured . ' +
        '     prisoners:place_captured skos:prefLabel ?place_captured_lbl . ' +
        '     FILTER( lang(?place_captured_lbl)="{1}" ) ' +
        '     OPTIONAL { ' +
        '          ?rei a rdf:Statement . ' +
        '          ?rei rdf:subject ?id . ' +
        '          ?rei rdf:predicate prisoners:place_captured . ' +
        '          ?rei rdf:object ?place_captured . ' +
        '          ?rei dc:source ?place_captured_source_temp ' +
        '     } ' +
        '   BIND ( if (BOUND (?place_captured_source_temp), ?place_captured_source_temp, CONCAT("no_source_for_", STR(?place_captured)) )  as ?place_captured_source )  ' +
        '   } ' +
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
                console.log(objectMapperService.makeObjectList(data));
                return objectMapperService.makeObjectList(data);
            });
        };
    });
})();
