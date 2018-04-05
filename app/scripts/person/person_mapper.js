(function() {
    'use strict';

    angular.module('eventsApp')
    .factory('personMapperService', function(translateableObjectMapperService, Person) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        PersonMapper.prototype.reviseObject = reviseObject;
        PersonMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);
        PersonMapper.prototype.objectClass = Person;

        return new PersonMapper();

        function PersonMapper() { }

        function reviseObject(obj, orig) {
            obj = translateableObjectMapperService.reviseObject(obj, orig);

            if (obj.num_children) {
                var n = parseInt(obj.num_children, 10);
                obj.num_children = isNaN(n) ? obj.num_children : n;
            }

            if (obj.wikilink) {
                obj.wikilink = [{ id: obj.wikilink, label: obj.getLabel() }];
            }

            return obj;
        }

    })
    .factory('Person', function(_, TranslateableObject) {
        Person.prototype.getMetaDescription = getMetaDescription;
        Person.prototype.getInfo = getInfo;
        Person.prototype.getBirthDateInfo = getBirthDateInfo;
        Person.prototype.getDeathDateInfo = getDeathDateInfo;
        Person.prototype.getBirthMunicipalityInfo = getBirthMunicipalityInfo;
        Person.prototype.getHomeMunicipalityInfo = getHomeMunicipalityInfo;
        Person.prototype.getResidenceMunicipalityInfo = getResidenceMunicipalityInfo;
        Person.prototype.getMaritalStatusInfo = getMaritalStatusInfo;
        Person.prototype.getUnitInfo = getUnitInfo;
        Person.prototype.getRankInfo = getRankInfo;

        Person.prototype = angular.extend({}, TranslateableObject.prototype, Person.prototype);

        return Person;

        function Person() { }

        function getMetaDescription() {
            if (this.description) {
                return this.description;
            }
            var lifeSpan = '';

            if (this.birth || this.death) {
                lifeSpan = ', ' + (this.birth ? this.birth : '?') +
                    (this.birth_place ? ' ' + this.birth_place : '') + ' \u2013 ' +
                    (this.death ? this.death : '?') +
                    (this.death_place ? ' ' + this.death_place : '');
            }
            var unit = this.cas_unit ? ', ' + this.cas_unit : '';

            return this.label + unit + lifeSpan;
        }

        function getBirthDateInfo() {
            return this.getInfo('birthDate', 'birthEvent', 'date', 'birth_date', 'syntymaeaika');
        }

        function getDeathDateInfo() {
            return this.getInfo('deathDate', 'deathEvent', 'date', 'death_date', 'kuolinaika');
        }

        function getRankInfo() {
            return this.getInfo('rankInfo', 'rank', 'label', 'rank', 'sotilasarvo');
        }

        function getBirthMunicipalityInfo() {
            return this.getInfo('birthMunicipality', 'birthEvent', 'places', 'birth_place_literal',
                'synnyinkunta');
        }

        function getHomeMunicipalityInfo() {
            return this.getInfo('homeMunicipality', 'na', 'na', 'home_place_literal', 'kotikunta');
        }

        function getResidenceMunicipalityInfo() {
            return this.getInfo('residenceMunicipality', 'na', 'na', 'residence_place', 'asuinkunta');
        }

        function getMaritalStatusInfo() {
            return this.getInfo('maritalStatus', 'na', 'na', 'marital_status', 'siviilisaeaety');
        }

        function getUnitInfo() {
            return this.getInfo('unitInfo', 'units', 'label', 'unit', 'joukko_osasto');
        }

        function getInfo(infoName, ownProp, ownPropValue, prisonerProp, casualtyProp) {
            if (this[infoName]) {
                return this[infoName];
            }
            var info = [];
            var prisoner = _.get(this, 'prisonerRecord.properties.' + prisonerProp) || {};
            if (prisoner.id) {
                info.push({
                    id: prisoner.id,
                    source: prisoner.source
                });
            }
            var casualty = _.find(this.deathRecord,
                ['id', 'http://ldf.fi/schema/narc-menehtyneet1939-45/' + casualtyProp]) || {};
            if (casualty.description) {
                info.push({
                    id: casualty.description,
                    source: casualty.source
                });
            }
            var prop = _.isArray(this[ownProp]) ? this[ownProp][0] : this[ownProp];
            if (prop &&
                    !_.includes(_.compact([casualty.source, prisoner.source]), prop.source)) {
                info.push({
                    id: prop[ownPropValue],
                    source: prop[ownPropValue].source
                });
            }
            this[infoName] = info;
            return info;
        }
    });
})();
