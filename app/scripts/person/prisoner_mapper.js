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
            'birth_date',
            'time_captured',
            'returned_date',
            'death_date'
        ];

        var personDetails = {
            id: 'personDetails',
            props: [
                {
                    name: 'birth_date',
                    isDateValue: true
                },
                { name: 'birth_place_literal' },
                { name: 'home_place_literal' },
                { name: 'residence_place' },
                { name: 'has_occupation' },
                { name: 'marital_status' },
                { name: 'amount_children' },
                { name: 'rank' },
                { name: 'unit' }
            ]
        };

        var imprisonmentDetails = {
            id: 'imprisonmentDetails',
            props: [
                {
                    name: 'time_captured',
                    isDateValue: true
                },
                { name: 'place_captured_municipality' },
                { name: 'place_captured' },
                { name: 'explanation' },
                { name: 'located_in' },
                { name: 'confiscated_possession' },
                { name: 'other_information' },
            ]
        };

        var deathDetails = {
            id: 'deathDetails',
            props: [
                {
                    name: 'death_date',
                    isDateValue: true
                },
                { name: 'death_place' },
                { name: 'burial_place' },
                { name: 'declared_death' },
                { name: 'cause_of_death' },
            ]
        };

        var returnDetails = {
            id: 'returnDetails',
            props: [
                {
                    name: 'returned_date',
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
            return  prop.propertyLabel || prop[0].propertyLabel;
        }

        function getPropertyDescription(propertyName) {
            var prop = _.get(this, 'properties.' + propertyName);
            return  prop.propertyDescription || prop[0].propertyDescription;
        }
    });
})();
