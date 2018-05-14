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
        Person.prototype.getOwnInfo = getOwnInfo;
        Person.prototype.getOwnDateInfo = getOwnDateInfo;
        Person.prototype.getCasualtyInfo = getCasualtyInfo;
        Person.prototype.getPrisonerInfo = getPrisonerInfo;
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
        Person.prototype.hasDeathInfo = hasDeathInfo;
        Person.prototype.hasMiaInfo = hasMiaInfo;
        Person.prototype.hasInfo = hasInfo;

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

        function hasInfo(infoFuns) {
            var self = this;
            return !!_.compact(_.map(infoFuns, function(info) { return self[info]().length; })).length;
        }

        function hasDeathInfo() {
            var infos = ['getDeathDateInfo', 'getDeclaredDeathDateInfo', 'getDeathPlaceInfo',
                'getCauseOfDeathInfo', 'getBurialPlaceInfo', 'getCemeteryInfo'];
            return this.hasInfo(infos);
        }

        function hasMiaInfo() {
            var infos = ['getDisappearanceDateInfo', 'getDisappearancePlaceInfo',
                'getDisappearanceMunicipalityInfo'];
            return this.hasInfo(infos);
        }

        function getFamilyNameInfo() {
            return this.getInfo('familyNameInfo', 'na', 'na', 'family_name', 'sukunimi');
        }

        function getGivenNameInfo() {
            return this.getInfo('givenNameInfo', 'na', 'na', 'given_name', 'etunimet');
        }

        function getBirthDateInfo() {
            return this.getInfo('birthDate', 'birthEvent', 'timeSpanString', 'birth_date', 'syntymaeaika', true);
        }

        function getGenderInfo() {
            return this.getInfo('gender', 'na', 'na', 'gender', 'sukupuoli');
        }

        function getDeathDateInfo() {
            return this.getInfo('deathDate', 'deathEvent', 'timeSpanString', 'death_date', 'kuolinaika', true);
        }

        function getDeclaredDeathDateInfo() {
            return this.getInfo('declaredDeathDate', 'na', 'na', 'declared_death', 'na', true);
        }

        function getDeathPlaceInfo() {
            return this.getInfo('deathPlace', 'deathEvent', 'places', 'death_place', 'kuolinpaikka');
        }

        function getDisappearanceDateInfo() {
            return this.getInfo('disappearanceDate', 'na', 'na', 'time_gone_missing', 'katoamisaika', true);
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

        function getInfo(infoName, ownProp, ownPropValue, prisonerProp, casualtyProp, isDate) {
            if (_.has(this, infoName)) {
                return this[infoName];
            }

            var info = this.getPrisonerInfo({}, infoName, prisonerProp);
            info = this.getCasualtyInfo(info, infoName, casualtyProp);
            info = isDate ? this.getOwnDateInfo(info, infoName, ownProp) : this.getOwnInfo(info,
                infoName, ownProp, ownPropValue);

            var res = _.values(info);
            this[infoName] = res;

            return res;
        }

        function getOwnDateInfo(info, infoName, ownProp) {
            var resource = _.first(_.castArray(this[ownProp]));

            if (resource) {
                var value = resource.timeSpanString;
                if (value) {
                    try {
                        // Prefer the ISO date string in order to match other sources
                        var startTime = resource.start_time.split('T')[0];
                        if (startTime === resource.end_time.split('T')[0]) {
                            value = startTime;
                        }
                    }
                    catch(e) { /* start_time/end_time not defined */ }

                    var source = resource.source || '?';
                    if (_.get(info[value], 'id')) {
                        info[value].source = _.compact(info[value].source).concat(source);
                    } else {
                        info[value] = {
                            id: value,
                            source: source
                        };
                    }
                }
            }
            return info;
        }

        function getOwnInfo(info, infoName, ownProp, ownPropValue) {
            var resource = _.first(_.castArray(this[ownProp]));

            if (resource) {
                var value = _.first(_.castArray(resource[ownPropValue]));
                if (value) {
                    var label = value.label;
                    if (label && info[label]) {
                        info[label].valueLabel = info[label].valueLabel || info[label].id;
                        info[label].id = value.id;
                        return info;
                    }

                    var propVal = {};
                    if (label) {
                        propVal.id = value.id;
                        propVal.valueLabel = value.label;
                    } else {
                        propVal.id = value;
                    }
                    propVal.source = resource.source || '?';

                    label = value.label || value;

                    if (!info[label] || resource.source && !_.includes(_.map(info[label], 'source'), resource.source)) {
                        info[label] = _.compact(info[label]).concat(propVal);
                    }
                }
            }
            return info;
        }

        function getCasualtyInfo(info, infoName, casualtyProp) {
            var casualty = _.find(this.deathRecord,
                ['id', 'http://ldf.fi/schema/narc-menehtyneet1939-45/' + casualtyProp]) || {};
            if (casualty.description) {
                var value = {
                    id: casualty.description,
                    source: casualty.source
                };
                info[casualty.description] = _.compact(info[casualty.description]).concat(value);
            }
            return info;
        }

        function getPrisonerInfo(info, infoName, prisonerProp) {
            var prisoner = _.compact(_.castArray(_.get(this, 'prisonerRecord.properties.' + prisonerProp)));
            if (!_.isEmpty(prisoner)) {
                prisoner.forEach(function(p) {
                    var lbl = p.valueLabel ? p.valueLabel : p.id;
                    info[lbl] = _.compact(info[lbl]).concat(p);
                });
            }
            return info;
        }
    });
})();
