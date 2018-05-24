(function() {
    'use strict';

    angular.module('eventsApp')
    /* ngInject */
    .factory('deathRecordMapperService', function(_, translateableObjectMapperService, TranslateableObject,
            dateUtilService, DeathRecord) {
        var proto = Object.getPrototypeOf(translateableObjectMapperService);

        DeathRecordMapper.prototype = angular.extend({}, proto, DeathRecordMapper.prototype);
        DeathRecordMapper.prototype.postProcess = postProcess;
        DeathRecordMapper.prototype.objectClass = DeathRecord;

        return new DeathRecordMapper();

        function DeathRecordMapper() { }

        function postProcess(objects) {
            objects = translateableObjectMapperService.postProcess(objects);
            return _.map(objects, function(obj) {
                obj.prop = obj.id.replace(/.*\/(.*)$/, '$1');
                return obj;
            });
        }

    })
    /* ngInject */
    .factory('DeathRecord', function(_, TranslateableObject) {
        DeathRecord.prototype = angular.extend({}, TranslateableObject.prototype);

        return DeathRecord;

        function DeathRecord() { }
    });
})();
