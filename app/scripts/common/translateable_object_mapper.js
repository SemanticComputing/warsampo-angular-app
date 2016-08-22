(function() {
    'use strict';

    angular.module('eventsApp')
    .factory('translateableObjectMapperService', function(objectMapperService, defaultLocale, TranslateableObject) {
        function TranslateableObjectMapper() { }

        function reviseObject(obj, orig) {
            setLangAttr(obj, 'label', orig);
            setLangAttr(obj, 'description', orig);
            setLangAttr(obj, 'type', orig);
            return obj;
        }

        function setLangAttr(obj, attr, orig) {
            var val = orig[attr];
            if (val) {
                var lang = val['xml:lang'];
                if (lang) {
                    obj['trans_' + attr + '_' + lang] = val.value;
                }
            }
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

        TranslateableObject.prototype.getLabel = function() {
            return this.getLangAttr('label');
        };
        TranslateableObject.prototype.getDescription = function() {
            return this.getLangAttr('description');
        };
        TranslateableObject.prototype.getTypeLabel = function() {
            return this.getLangAttr('type');
        };

        function getLangAttr(attr) {
            var val = this['trans_' + attr + '_' + $translate.use()] || this[attr];
            if (_.isArray(val)) {
                return val[0];
            }
            return val;
        }
        return TranslateableObject;
    });

})();
