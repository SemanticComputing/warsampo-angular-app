(function() {
    'use strict';

    angular.module('eventsApp')
    .factory('prisonerMapperService', function(_, objectMapperService, dateUtilService,
            PrisonerRecord) {
        var proto = Object.getPrototypeOf(objectMapperService);

        PrisonerMapper.prototype.reviseObject = reviseObject;
        PrisonerMapper.prototype.postProcess = postProcess;
        PrisonerMapper.prototype = angular.extend({}, proto, PrisonerMapper.prototype);
        PrisonerMapper.prototype.objectClass = PrisonerRecord;

        var dateVals = [
            'birth_date',
            'time_captured',
            'returned_date',
            'death_date'
        ];

        return new PrisonerMapper();

        function PrisonerMapper() { }

        function reviseObject(obj) {
            dateVals.forEach(function(key) {
                var date = _.get(obj, 'properties[' + key + '].id');
                if (date) {
                    obj.properties[key].id = dateUtilService.formatDate(date);
                }
            });
            return obj;
        }

        function postProcess(objects) {
            return _.map(objects, function(obj) {
                delete obj.properties.id;
                return obj;
            });
        }
    })
    .factory('PrisonerRecord', function() {

        return PrisonerRecord;

        function PrisonerRecord() { }
    });
})();
