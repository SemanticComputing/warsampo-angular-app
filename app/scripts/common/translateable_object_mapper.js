(function() {
    'use strict';

    angular.module('eventsApp')
    .factory('translateableObjectMapperService', function(_, objectMapperService, defaultLocale, TranslateableObject) {
        function TranslateableObjectMapper() { }

        function reviseObject(obj, orig) {
            obj.setLangAttr('label', orig);
            obj.setLangAttr('description', orig);
            obj.setLangAttr('type', orig);
            return obj;
        }

        var proto = Object.getPrototypeOf(objectMapperService);
        TranslateableObjectMapper.prototype = angular.extend({}, proto, TranslateableObjectMapper.prototype);
        TranslateableObjectMapper.prototype.objectClass = TranslateableObject;
        TranslateableObjectMapper.prototype.reviseObject = reviseObject;

        return new TranslateableObjectMapper();
    })
    .factory('TranslateableObject', function($translate, _) {
        function TranslateableObject() { }

        TranslateableObject.prototype.getLangAttr = getLangAttr;
        TranslateableObject.prototype.setLangAttr = setLangAttr;

        TranslateableObject.prototype.getLabel = function() {
            return this.getLangAttr('label');
        };
        TranslateableObject.prototype.getDescription = function() {
            return this.getLangAttr('description');
        };
        TranslateableObject.prototype.getTypeLabel = function() {
            return this.getLangAttr('type');
        };

        return TranslateableObject;

        function getLangAttr(attr) {
            var val = _.get(this, attr + '_trans_' + $translate.use()) || this[attr];
            if (_.isArray(val)) {
                return val[0];
            }
            return val;
        }

        function setLangAttr(attr, orig) {
            var val = orig[attr.replace('.', '__')];
            if (val) {
                var lang = val['xml:lang'];
                if (lang) {
                    _.set(this, attr + '_trans_' + lang, val.value);
                }
            }
        }
    });

})();
