(function() {
    'use strict';

    angular.module('eventsApp')
    /* ngInject */
    .factory('prisonerMapperService', function(_, translateableObjectMapperService, TranslateableObject,
            dateUtilService, PrisonerRecord) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        PrisonerMapper.prototype = angular.extend({}, proto, PrisonerMapper.prototype);
        PrisonerMapper.prototype.postProcess = postProcess;
        PrisonerMapper.prototype.objectClass = PrisonerRecord;

        return new PrisonerMapper();

        function PrisonerMapper() { }

        function postProcess(objects) {
            objects = translateableObjectMapperService.postProcess(objects);
            return _.map(objects, function(obj) {
                delete obj.properties.id;
                return obj;
            });
        }

    })
    /* ngInject */
    .factory('PrisonerRecord', function(_, TranslateableObject) {
        PrisonerRecord.prototype = angular.extend({}, TranslateableObject.prototype);
        PrisonerRecord.prototype.isDateValue = isDateValue;
        PrisonerRecord.prototype.getPropertyLabel = getPropertyLabel;
        PrisonerRecord.prototype.getPropertyDescription = getPropertyDescription;
        PrisonerRecord.prototype.getPersonDetails = getPersonDetails;
        PrisonerRecord.prototype.getImprisonmentDetails = getImprisonmentDetails;
        PrisonerRecord.prototype.getDeathDetails = getDeathDetails;
        PrisonerRecord.prototype.getReturnDetails = getReturnDetails;
        PrisonerRecord.prototype.getDetails = getDetails;

        var dateVals = [
            'date_of_birth',
            'date_of_capture',
            'date_of_return',
            'date_of_death'
        ];

        var personDetails = {
            id: 'personDetails',
            props: [
                {
                    name: 'date_of_birth',
                    isDateValue: true
                },
                { name: 'municipality_of_birth' },
                { name: 'municipality_of_domicile' },
                { name: 'municipality_of_residence' },
                { name: 'has_occupation' },
                { name: 'marital_status' },
                { name: 'number_of_children' },
                { name: 'rank' },
                { name: 'rank_literal' },
                { name: 'unit' }
            ]
        };

        var imprisonmentDetails = {
            id: 'imprisonmentDetails',
            props: [
                {
                    name: 'date_of_capture',
                    isDateValue: true
                },
                { name: 'municipality_of_capture' },
                { name: 'place_of_capture_literal' },
                { name: 'description_of_capture' },
                { name: 'captivity' },
                { name: 'confiscated_possession' },
                { name: 'additional_information' },
            ]
        };

        var deathDetails = {
            id: 'deathDetails',
            props: [
                {
                    name: 'date_of_death',
                    isDateValue: true
                },
                { name: 'place_of_death' },
                { name: 'place_of_burial_literal' },
                { name: 'date_of_declaration_of_death' },
                { name: 'cause_of_death' },
            ]
        };

        var returnDetails = {
            id: 'returnDetails',
            props: [
                {
                    name: 'date_of_return',
                    isDateValue: true
                },
            ]
        };

        return PrisonerRecord;

        function PrisonerRecord() { }

        function isDateValue(attr) {
            return _.includes(dateVals, attr);
        }

        function getDetails(detailList) {
            var self = this;
            if (_.has(self, detailList.id)) {
                return self[detailList.id];
            }
            var res = [];
            detailList.props.forEach(function(prop) {
                if (self.properties[prop.name]) {
                    res.push(angular.extend({}, prop, { property: self.properties[prop.name] }));
                }
            });
            self[detailList.id] = res;
            return res;
        }

        function getPersonDetails() {
            return this.getDetails(personDetails);
        }

        function getImprisonmentDetails() {
            return this.getDetails(imprisonmentDetails);
        }

        function getDeathDetails() {
            return this.getDetails(deathDetails);
        }

        function getReturnDetails() {
            return this.getDetails(returnDetails);
        }

        function getPropertyLabel(propertyName) {
            var prop = _.get(this, 'properties.' + propertyName);
            return prop.propertyLabel || prop[0].propertyLabel;
        }

        function getPropertyDescription(propertyName) {
            var prop = _.get(this, 'properties.' + propertyName);
            return prop.propertyDescription || prop[0].propertyDescription;
        }
    });
})();
