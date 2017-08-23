(function() {
    'use strict';

    /*
    * Service for transforming event SPARQL results into objects.
    */
    angular.module('eventsApp')
    .factory('semanticModelMapperService', semanticModelMapperService);

    /* ngInject */
    function semanticModelMapperService(_, translateableObjectMapperService, TranslateableObject) {
        var imageTypes = ['png', 'jpg', 'jpeg', 'gif'];
        var latUri = 'http://www.w3.org/2003/01/geo/wgs84_pos#lat';
        var lonUri = 'http://www.w3.org/2003/01/geo/wgs84_pos#long';
        var descriptionAttrs = [
            'http://dbpedia.org/ontology/abstract',
            'http://purl.org/dc/terms/description'
        ];

        var objProto = Object.getPrototypeOf(TranslateableObject);
        SemanticModel.prototype = angular.extend({}, objProto, TranslateableObject.prototype);
        SemanticModel.prototype.nonProperties = ['type', 'label', 'id', 'properties',
            'fetchRelated', 'nonProperties', 'lat', 'lon', 'imageUrl', 'link', 'getLabel',
            'getDescription', 'getLangAttr', 'setLangAttr', 'getTypeLabel', 'descriptionProperties',
            'langAttrs'];
        SemanticModel.prototype.descriptionProperties = descriptionAttrs;
        SemanticModel.prototype.getDescription = getDescription;

        var proto = Object.getPrototypeOf(translateableObjectMapperService);
        SemanticModelMapper.prototype = angular.extend({}, proto, SemanticModelMapper.prototype);

        SemanticModelMapper.prototype.postProcess = postProcess;
        SemanticModelMapper.prototype.makeObject = makeObject;
        SemanticModelMapper.prototype.getLabel = getLabel;

        return new SemanticModelMapper();

        function SemanticModel() { }

        function getDescription() {
            var self = this;
            var desc;
            _.forEach(self.descriptionProperties, function(prop) {
                if (self.properties[prop]) {
                    desc = self.properties[prop].value;
                    return false;
                }
            });
            return desc ? desc.getLangAttr('value') : self.getLabel();
        }

        function getLabel() {
            var lbl = this.getLangAttr('label');
            return _.isArray(lbl) ? lbl[0] : lbl;
        }

        function SemanticModelMapper() { }

        function postProcess(objects) {
            _.forEach(objects, function(o) {
                o.properties = {};
                _.forIn(o, function(v, k) {
                    if (o.nonProperties.indexOf(k) === -1 && !k.match(/(_trans_)|(_origval)/)) {
                        o.properties[k] = v;
                        delete o[k];
                    }
                });
            });
            return objects;
        }

        function makeObject(obj) {
            var o = new SemanticModel();

            o.id = obj.id.value;
            if (obj.type) {
                o.type = {
                    id: obj.type.value,
                };
                setLangAttribute(o.type, 'type_label', obj.type_label);
            }

            if (obj.label) {
                o.label = obj.label.value;
            }

            if (obj.link) {
                o.link = {
                    id: obj.link.value,
                    labelFromUri: getLabelFromUri(obj.link.value)
                };
                setLangAttribute(o.link, 'label', obj.link_label);
            }

            if (!obj.pred) {
                return o;
            }

            var objKey =  obj.pred.value;
            var prop = new SemanticModel();
            prop.pred_type = obj.pred.value;
            prop.labelFromUri = getLabelFromUri(obj.pred.value);
            prop.value = {
                type: obj.obj.type
            };
            if (prop.value.type === 'uri') {
                prop.value.id = obj.obj.value;
            }

            setLangAttribute(prop, 'pred_label', obj.pred_label);
            setLangAttribute(prop.value, 'value', obj.obj);
            setLangAttribute(prop.value, 'label', obj.obj_label);

            o[objKey] = prop;

            // Check if this property is a URL to an image
            var imgMatch = obj.obj.value.match(/\.(\w+?)(\?.*)?$/);
            if (imgMatch && _.includes(['uri', 'literal'], prop.value.type)) {
                if (_.includes(imageTypes, imgMatch[1])) {
                    o.imageUrl = obj.obj.value;
                }
            // Check if this property is a coordinate
            } else if (prop.pred_type === latUri) {
                o.lat = prop.value;
            } else if (prop.pred_type === lonUri) {
                o.lon = prop.value;
            }

            return o;
        }

        function setLangAttribute(o, attr, val) {
            if (!val) {
                return;
            }
            var lang = _.get(val, '[xml:lang]');
            if (lang) {
                _.set(o, attr + '_trans_' + lang, val.value);
            }
            _.set(o, attr + '_origval', val.value);
            _.set(o, attr, val.value);

        }

        function getLabelFromUri(value) {
            return _.kebabCase(value.match(/[#/]([\w-()]+?)$/)[1]).replace(/-/g, ' ');
        }
    }
})();
