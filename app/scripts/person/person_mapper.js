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
        Person.prototype.getFamilyNameInfo = getFamilyNameInfo;
        Person.prototype.getGivenNameInfo = getGivenNameInfo;
        Person.prototype.getGenderInfo = getGenderInfo;
        Person.prototype.getBirthDateInfo = getBirthDateInfo;
        Person.prototype.getDeathDateInfo = getDeathDateInfo;
        Person.prototype.getDeclaredDeathDateInfo = getDeclaredDeathDateInfo;
        Person.prototype.getDeathPlaceInfo = getDeathPlaceInfo;
        Person.prototype.getDisappearanceDateInfo = getDisappearanceDateInfo;
        Person.prototype.getDisappearancePlaceInfo = getDisappearancePlaceInfo;
        Person.prototype.getDisappearanceMunicipalityInfo = getDisappearanceMunicipalityInfo;
        Person.prototype.getBurialPlaceInfo = getBurialPlaceInfo;
        Person.prototype.getCemeteryInfo = getCemeteryInfo;
        Person.prototype.getCauseOfDeathInfo = getCauseOfDeathInfo;
        Person.prototype.getBirthMunicipalityInfo = getBirthMunicipalityInfo;
        Person.prototype.getHomeMunicipalityInfo = getHomeMunicipalityInfo;
        Person.prototype.getResidenceMunicipalityInfo = getResidenceMunicipalityInfo;
        Person.prototype.getMaritalStatusInfo = getMaritalStatusInfo;
        Person.prototype.getUnitInfo = getUnitInfo;
        Person.prototype.getRankInfo = getRankInfo;
        Person.prototype.getOccupationInfo = getOccupationInfo;

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

        function getFamilyNameInfo() {
            return this.getInfo('familyNameInfo', 'na', 'na', 'family_name', 'sukunimi');
        }

        function getGivenNameInfo() {
            return this.getInfo('givenNameInfo', 'na', 'na', 'given_name', 'etunimet');
        }

        function getBirthDateInfo() {
            return this.getInfo('birthDate', 'birthEvent', 'timeSpanString', 'birth_date', 'syntymaeaika');
        }

        function getGenderInfo() {
            return this.getInfo('gender', 'na', 'na', 'gender', 'sukupuoli');
        }

        function getDeathDateInfo() {
            return this.getInfo('deathDate', 'deathEvent', 'timeSpanString', 'death_date', 'kuolinaika');
        }

        function getDeclaredDeathDateInfo() {
            return this.getInfo('declaredDeathDate', 'na', 'na', 'declared_death', 'na');
        }

        function getDeathPlaceInfo() {
            return this.getInfo('deathPlace', 'deathEvent', 'places', 'death_place', 'kuolinpaikka');
        }

        function getDisappearanceDateInfo() {
            return this.getInfo('disappearanceDate', 'na', 'na', 'time_gone_missing', 'katoamisaika');
        }

        function getDisappearancePlaceInfo() {
            return this.getInfo('disappearancePlace', 'na', 'na', 'place_gone_missing', 'katoamispaikka');
        }

        function getDisappearanceMunicipalityInfo() {
            return this.getInfo('disappearanceMunicipality', 'na', 'na', 'na', 'katoamiskunta');
        }

        function getBurialPlaceInfo() {
            return this.getInfo('burialPlace', 'na', 'na', 'burial_place', 'hautauskunta');
        }

        function getCemeteryInfo() {
            return this.getInfo('cemetery', 'na', 'na', 'na', 'hautausmaa');
        }

        function getCauseOfDeathInfo() {
            return this.getInfo('causeOfDeath', 'na', 'na', 'cause_of_death', 'menehtymisluokka');
        }

        function getRankInfo() {
            return this.getInfo('rankInfo', 'rank', 'label', 'warsa_rank', 'sotilasarvo');
        }

        function getOccupationInfo() {
            return this.getInfo('occupationInfo', 'na', 'na', 'occupation_literal', 'ammatti');
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
            var info = {};
            var prisoner = _.compact(_.castArray(_.get(this, 'prisonerRecord.properties.' + prisonerProp)));
            if (!_.isEmpty(prisoner)) {
                prisoner.forEach(function(p) {
                    var lbl = p.valueLabel ? p.valueLabel : p.id;
                    info[lbl] = _.compact(info[lbl]).concat(p.source);
                });
            }
            var casualty = _.find(this.deathRecord,
                ['id', 'http://ldf.fi/schema/narc-menehtyneet1939-45/' + casualtyProp]) || {};
            if (casualty.description) {
                info[casualty.description] = _.compact(info[casualty.description]).concat(casualty.source);
            }
            var resource = (_.first(_.castArray(this[ownProp])) || {})[0];

            if (resource && !_.includes(_.compact([casualty.source, prisoner.source]), resource.source)) {
                var value = _.first(_.castArray(value[ownPropValue]));
                if (value) {
                    info[value] = _.compact(info[value]).concat(resource.source);
                }
            }
            var res = [];
            _.keys(info).forEach(function(key) {
                res.push({ id: key, source: info[key] });
            });
            this[infoName] = res;
            return res;
        }
    });
})();
