(function() {
    'use strict';

    angular.module('eventsApp')
    .factory('translateableObjectMapperService', function(objectMapperService, defaultLocale, TranslateableObject) {
        function TranslateableObjectMapper() { }

        function reviseObject(obj, orig) {
            setLangAttr(obj, 'label', orig);
            setLangAttr(obj, 'description', orig);
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
    .factory('TranslateableObject', function($translate) {
        function TranslateableObject() { }

        TranslateableObject.prototype.getLangAttr = getLangAttr;

        TranslateableObject.prototype.getLabel = function() {
            return this.getLangAttr('label');
        };
        TranslateableObject.prototype.getDescription = function() {
            return this.getLangAttr('description');
        };

        function getLangAttr(attr) {
            return this['trans_' + attr + '_' + $translate.use()] || this[attr];
        }
        return TranslateableObject;
    });

})();
