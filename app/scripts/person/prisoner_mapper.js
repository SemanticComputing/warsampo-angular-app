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

        var dateVals = [
            'birth_date',
            'time_captured',
            'returned_date',
            'death_date'
        ];

        return PrisonerRecord;

        function PrisonerRecord() { }

        function isDateValue(attr) {
            return _.includes(dateVals, attr);
        }
    });
})();
