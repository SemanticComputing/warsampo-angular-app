(function() {
    'use strict';

    angular.module('eventsApp')
    .factory('personMapperService', function(_, translateableObjectMapperService, Person) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        PersonMapper.prototype.reviseObject = reviseObject;
        PersonMapper.prototype = angular.extend({}, proto, PersonMapper.prototype);
        PersonMapper.prototype.objectClass = Person;

        return new PersonMapper();

        function PersonMapper() { }

        function reviseObject(obj, orig) {
            obj = translateableObjectMapperService.reviseObject(obj, orig);

            if (obj.number_of_children) {
                var n = parseInt(obj.number_of_children, 10);
                obj.number_of_children = isNaN(n) ? obj.number_of_children : n;
            }

            if (obj.wikilink) {
                obj.wikilink = [{ id: obj.wikilink, label: obj.getLabel() }];
            }

            if (!_.isArray(obj.source)) {
                obj.source = obj.source ? _.castArray(obj.source) : [];
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
        Person.prototype.getSourceNumber = getSourceNumber;
        Person.prototype.addValue = addValue;

        Person.prototype.getFamilyNameInfo = getFamilyNameInfo;
        Person.prototype.getGivenNameInfo = getGivenNameInfo;
        Person.prototype.getGenderInfo = getGenderInfo;
        Person.prototype.getBirthDateInfo = getBirthDateInfo;
        Person.prototype.getBirthMunicipalityInfo = getBirthMunicipalityInfo;
        Person.prototype.getHomeMunicipalityInfo = getHomeMunicipalityInfo;
        Person.prototype.getResidenceMunicipalityInfo = getResidenceMunicipalityInfo;
        Person.prototype.getMaritalStatusInfo = getMaritalStatusInfo;
        Person.prototype.getUnitInfo = getUnitInfo;
        Person.prototype.getRankInfo = getRankInfo;
        Person.prototype.getOccupationInfo = getOccupationInfo;
        Person.prototype.getCitizenshipInfo= getCitizenshipInfo;
        Person.prototype.getNationalityInfo= getNationalityInfo;
        Person.prototype.getMotherTongueInfo= getMotherTongueInfo;
        Person.prototype.getNumberOfChildren= getNumberOfChildren;

        Person.prototype.getDisappearanceDateInfo = getDisappearanceDateInfo;
        Person.prototype.getDisappearancePlaceInfo = getDisappearancePlaceInfo;
        Person.prototype.getDisappearanceMunicipalityInfo = getDisappearanceMunicipalityInfo;
        Person.prototype.getBurialPlaceInfo = getBurialPlaceInfo;
        Person.prototype.getCemeteryInfo = getCemeteryInfo;
        Person.prototype.getGraveNumberInfo = getGraveNumberInfo;
        Person.prototype.getCauseOfDeathInfo = getCauseOfDeathInfo;

        Person.prototype.getWoundingDateInfo = getWoundingDateInfo;
        Person.prototype.getWoundingPlaceInfo = getWoundingPlaceInfo;

        Person.prototype.getMunicipalityOfCaptureInfo = getMunicipalityOfCaptureInfo;
        Person.prototype.getDateOfCaptureInfo = getDateOfCaptureInfo;
        Person.prototype.getPlaceOfCaptureInfo = getPlaceOfCaptureInfo;
        Person.prototype.getPlaceOfCaptureBattleInfo = getPlaceOfCaptureBattleInfo;
        Person.prototype.getDescriptionOfCaptureInfo = getDescriptionOfCaptureInfo;
        Person.prototype.getCaptivityInfo = getCaptivityInfo;
        Person.prototype.getConsfiscatedPossessionInfo = getConsfiscatedPossessionInfo;
        Person.prototype.getAdditionalImprisonmentInfo = getAdditionalImprisonmentInfo;
        Person.prototype.getDateOfReturnInfo = getDateOfReturnInfo;

        Person.prototype.getDeathDateInfo = getDeathDateInfo;
        Person.prototype.getDeclaredDeathDateInfo = getDeclaredDeathDateInfo;
        Person.prototype.getDeathPlaceInfo = getDeathPlaceInfo;
        Person.prototype.getAdditionalDeathInfo = getAdditionalDeathInfo;

        Person.prototype.getPropagandaMagazineInfo = getPropagandaMagazineInfo;
        Person.prototype.getSotilaanAaniInfo = getSotilaanAaniInfo;
        Person.prototype.getPhotographSotilaanAaniInfo = getPhotographSotilaanAaniInfo;
        Person.prototype.getPropagandaMagazineLinkInfo = getPropagandaMagazineLinkInfo;
        Person.prototype.getMemoirInfo= getMemoirInfo;

        Person.prototype.hasWoundingInfo = hasWoundingInfo;
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
                'getCauseOfDeathInfo', 'getBurialPlaceInfo', 'getCemeteryInfo', 'getWoundingDateInfo'];
            return this.hasInfo(infos);
        }

        function hasWoundingInfo() {
            var infos = ['getWoundingDateInfo', 'getWoundingPlaceInfo'];
            return this.hasInfo(infos);
        }

        function hasMiaInfo() {
            var infos = ['getDisappearanceDateInfo', 'getDisappearancePlaceInfo',
                'getDisappearanceMunicipalityInfo'];
            return this.hasInfo(infos);
        }

        function getFamilyNameInfo() {
            return this.getInfo('familyNameInfo', 'sname', undefined, 'family_name', 'family_name');
        }

        function getGivenNameInfo() {
            return this.getInfo('givenNameInfo', 'fname', undefined, 'given_names', 'given_names');
        }

        function getBirthDateInfo() {
            return this.getInfo('birthDate', 'birthEvent', 'timeSpanString', 'date_of_birth', 'date_of_birth', true);
        }

        function getGenderInfo() {
            return this.getInfo('gender', 'na', 'na', 'gender', 'sukupuoli');
        }

        function getWoundingDateInfo() {
            return this.getInfo('woundingDate', 'woundingEvent', 'timeSpanString', 'date_of_wounding', 'date_of_wounding',
                true);
        }

        function getWoundingPlaceInfo() {
            return this.getInfo('woundingPlaceInfo', 'woundingEvent', 'places', 'municipality_of_wounding', 'municipality_of_wounding');
        }

        function getDeathDateInfo() {
            return this.getInfo('deathDate', 'deathEvent', 'timeSpanString', 'date_of_death', 'date_of_death', true);
        }

        function getDeclaredDeathDateInfo() {
            return this.getInfo('declaredDeathDate', 'na', 'na', 'date_of_declaration_of_death', 'na', true);
        }

        function getDeathPlaceInfo() {
            return this.getInfo('deathPlace', 'deathEvent', 'places', 'place_of_death', 'place_of_death_literal');
        }

        function getDisappearanceDateInfo() {
            return this.getInfo('disappearanceDate', 'na', 'na', 'date_of_going_mia', 'date_of_going_mia', true);
        }

        function getDisappearancePlaceInfo() {
            return this.getInfo('disappearancePlace', 'na', 'na', 'place_of_going_mia_literal', 'place_of_going_mia');
        }

        function getDisappearanceMunicipalityInfo() {
            return this.getInfo('disappearanceMunicipality', 'na', 'na', 'na', 'municipality_of_going_mia');
        }

        function getBurialPlaceInfo() {
            return this.getInfo('burialPlace', 'na', 'na', 'place_of_burial_literal', 'municipality_of_burial');
        }

        function getCemeteryInfo() {
            return this.getInfo('cemetery', 'na', 'na', 'na', 'buried_in');
        }

        function getGraveNumberInfo() {
            return this.getInfo('graveNumber', 'na', 'na', 'na', 'place_of_burial_number');
        }

        function getCauseOfDeathInfo() {
            return this.getInfo('causeOfDeath', 'na', 'na', 'cause_of_death', 'perishing_category');
        }

        function getRankInfo() {
            return this.getInfo('rankInfo', 'rank', undefined, 'rank', 'rank');
        }

        function getOccupationInfo() {
            return this.getInfo('occupationInfo', 'na', 'na', 'has_occupation', 'has_occupation');
        }

        function getBirthMunicipalityInfo() {
            return this.getInfo('birthMunicipality', 'birthEvent', 'places', 'municipality_of_birth',
                'municipality_of_birth');
        }

        function getHomeMunicipalityInfo() {
            return this.getInfo('homeMunicipality', 'na', 'na', 'municipality_of_domicile', 'municipality_of_domicile');
        }

        function getResidenceMunicipalityInfo() {
            return this.getInfo('residenceMunicipality', 'na', 'na', 'municipality_of_residence', 'municipality_of_residence');
        }

        function getMaritalStatusInfo() {
            return this.getInfo('maritalStatus', 'na', 'na', 'marital_status', 'marital_status');
        }

        function getUnitInfo() {
            return this.getInfo('unitInfo', 'units', undefined, 'unit', 'unit');
        }

        function getCitizenshipInfo() {
            return this.getInfo('citizenshipInfo', 'na', 'na', 'citizenship', 'citizenship');
        }

        function getNationalityInfo() {
            return this.getInfo('nationalityInfo', 'na', 'na', 'nationality', 'nationality');
        }

        function getMotherTongueInfo() {
            return this.getInfo('motherTongueInfo', 'na', 'na', 'mother_tongue', 'mother_tongue');
        }

        function getAdditionalDeathInfo() {
            return this.getInfo('additionalDeathInfo', 'na', 'na', 'na', 'additional_information');
        }

        function getDateOfCaptureInfo() {
            return this.getInfo('dateOfCapture', 'na', 'na', 'date_of_capture', 'na', true);
        }

        function getMunicipalityOfCaptureInfo() {
            return this.getInfo('municipalityOfCapture', 'na', 'na', 'municipality_of_capture', 'na');
        }

        function getPlaceOfCaptureInfo() {
            return this.getInfo('placeOfCapture', 'na', 'na', 'place_of_capture', 'na');
        }

        function getDescriptionOfCaptureInfo() {
            return this.getInfo('descriptionOfCapture', 'na', 'na', 'description_of_capture', 'na');
        }

        function getCaptivityInfo() {
            return this.getInfo('captivity', 'na', 'na', 'captivity', 'na');
        }

        function getConsfiscatedPossessionInfo() {
            return this.getInfo('confiscatedPossession', 'na', 'na', 'consfiscated_possession', 'na');
        }

        function getAdditionalImprisonmentInfo() {
            return this.getInfo('additionalInprisonmentInfo', 'na', 'na', 'additional_information', 'na');
        }

        function getDateOfReturnInfo() {
            return this.getInfo('dateOfReturn', 'na', 'na', 'date_of_return', 'na', true);
        }

        function getNumberOfChildren() {
            return this.getInfo('numberOfChildren', 'na', 'na', 'number_of_children', 'number_of_children');
        }

        function getPlaceOfCaptureBattleInfo() {
            return this.getInfo('placeOfCaptureBattle', 'na', 'na', 'place_of_capture_battle_literal', 'na');
        }

        function getPropagandaMagazineInfo() {
            return this.getInfo('propagandaMagazine', 'na', 'na', 'propaganda_magazine', 'na');
        }

        function getSotilaanAaniInfo() {
            return this.getInfo('sotilaanAani', 'na', 'na', 'sotilaan_aani', 'na');
        }

        function getPhotographSotilaanAaniInfo() {
            return this.getInfo('photographSotilaanAani', 'na', 'na', 'photograph_sotilaan_aani', 'na');
        }

        function getPropagandaMagazineLinkInfo() {
            return this.getInfo('propagandaMagazineLink', 'na', 'na', 'propaganda_magazine_link', 'na');
        }

        function getMemoirInfo() {
            return this.getInfo('memoir', 'na', 'na', 'memoir', 'na');
        }

        function getSourceNumber(sourceName) {
            if (sourceName === undefined) {
                return undefined;
            }

            var index = _.findIndex(this.source, function(sourceObj) { return sourceObj.label ? sourceObj.label.toLowerCase() == sourceName.toLowerCase() : 0; }) + 1;

            if (index === 0) {
                this.source = this.source.concat({ id: sourceName, label: sourceName });
                index = this.source.length;
            }

            return index;
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

            // Handle multiple value labels
            if (infoName === 'captivity') {
                if (Array.isArray(res)) {
                    res.forEach(function(r) {
                        if (Array.isArray(r.valueLabel)) {
                            if (r.valueLabel[0].startsWith('Henkilön') || r.valueLabel[0].startsWith('Person') ) {
                                r.valueLabel = r.valueLabel[1];
                            } else {
                                r.valueLabel = r.valueLabel[0];
                            }
                        }
                    });
                }
            }
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

                    var source = _.get(resource.source, 'label');
                    if (_.get(info[value], 'id')) {
                        info[value].source = _.uniq(_.compact(_.concat(info[value].source, source))).sort();
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
            // A person can have multiple values for a property, and the value can have multiple
            // values for its property.
            var resources = _.castArray(this[ownProp]);
            var person = this;

            resources.forEach(function(resource) {
                if (resource) {
                    var values = _.castArray(ownPropValue ? resource[ownPropValue] : resource);
                    values.forEach(function(value) {
                        if (value) {
                            var key = value.id || value;
                            if (key && info[key]) {
                                return info;
                            }

                            var propVal = {};
                            if (value.id) {
                                propVal.id = value.id;
                                propVal.valueLabel = value.label;
                            } else {
                                propVal.id = value;
                            }
                            // If the value is a literal, showing the source is problematic.
                            // One could use the source of the person instance, but as there can be multiple,
                            // it's not clear from which source the value is from. So we're leaving out the source
                            // from literal values for now.
                            propVal.source = _.isObjectLike(resource) ? (person.getSourceNumber(resource.source)) : undefined;

                            if (!info[key] || resource.source && !_.includes(_.map(info[key], 'source'), resource.source)) {
                                info[key] = _.compact(info[key]).concat(propVal);
                            }
                        }
                    });
                }
            });
            return info;
        }

        function addValue(info, value) {
            if (info[value.id]) {
                if (value.source) {
                    info[value.id].source = _.uniq(_.compact(info[value.id].source).concat(this.getSourceNumber(value.source))).sort();
                }
            } else {
                // source is (possibly) a getter, so create a new object.
                info[value.id] = angular.extend({}, value, { source: [this.getSourceNumber(value.source)] });
            }
            return info;
        }

        function getCasualtyInfo(info, infoName, casualtyProp) {
            var casualty = _.find(this.deathRecord,
                ['prop', casualtyProp]) || _.find(this.deathRecord, ['prop', casualtyProp + '_literal']) || {};
            if (casualty.description) {
                var literal = _.find(this.deathRecord,
                    ['prop', casualtyProp + '_literal']) || {};
                var value = {
                    id: casualty.obj_link || casualty.description,
                    source: casualty.source
                };
                if (casualty.obj_link) {
                    value.valueLabel = casualty.description || literal.description;
                }
                this.addValue(info, value);
            }
            return info;
        }

        function getPrisonerInfo(info, infoName, prisonerProp) {
            var self = this;
            var prisoner = _.compact(_.castArray(_.get(this, 'prisonerRecord.properties.' + prisonerProp)));

            if (!_.isEmpty(prisoner)) {
                prisoner.forEach(function(p) {
                    // Add POW register as a source
                    var p2 = angular.extend({}, p, { source: p.sourceRegister });
                    self.addValue(info, p2);

                    if (_.isArrayLikeObject(p.source)) {
                        // Multiple sources for information, loop over them
                        _.forEach(p.source, function(source) {
                            var ps = angular.extend({}, p, { source: source });
                            self.addValue(info, ps);
                        });
                    }
                    else {
                        self.addValue(info, p);
                    }
                });
            }
            return info;
        }
    });
})();
